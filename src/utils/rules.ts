import path from "path";
import { directoryExists, getAriHomeDir, getProjectDir } from "./file.js";
import fs from "fs-extra";
import { glob } from "glob";
import chalk from "chalk";
import {
  cloneRepo,
  pullLatestChanges,
  RepoDetails,
  SimpleRepoDetails,
} from "./git.js";
import { happyMessage } from "./user-message.js";
import { warningMessage } from "./user-message.js";
import { AriYaml, RepoRules, RuleFilePath, SelectedRules } from "./ari-yaml.js";
import _ from "lodash";

export interface FlatSelectedRules {
  include: FlatRepoRule[];
  exclude: FlatRepoRule[];
}

export interface FlatRepoRule {
  org: string;
  repo: string;
  relativeFilePath: RuleFilePath;
}

export const flattenRepoRules = (repoRules: RepoRules): FlatRepoRule[] => {
  return repoRules.relativeFilePaths.map((relativeFilePath) => ({
    org: repoRules.org,
    repo: repoRules.repo,
    relativeFilePath,
  }));
};

// TODO: Make this log out warnings if:
// 1. There are no rules in a repo
// 2. There are rules files beyond one level of nesting that will be missed
export const getCentralRules = async (
  repoDetails: SimpleRepoDetails[]
): Promise<RepoRules[]> => {
  return repoDetails.map((repoDetail) => {
    const { orgName, repoName, repoDir } = repoDetail;
    const rulesPattern = path.join(repoDir, "rules", "**", "*.mdc");
    const relativeFilePaths = glob.sync(rulesPattern);
    const fileNames = relativeFilePaths.map((filePath) => {
      const fileName = path.basename(filePath);
      const categoryFolderName = path.basename(path.dirname(filePath));
      return {
        fileName,
        categoryFolderName,
      };
    });
    return {
      org: orgName,
      repo: repoName,
      relativeFilePaths: fileNames,
    };
  });
};

export const updateAndGetCentralRulesFromAriYaml = async (
  ariYaml: AriYaml
): Promise<RepoRules[]> => {
  const repoDetails = ariYaml.repos;
  for (const repoDetail of repoDetails) {
    await pullLatestChanges(repoDetail.repoDir);
  }
  return getCentralRules(repoDetails);
};

export const getCentralRepoDir = (
  ariDir: string,
  org: string,
  repo: string
) => {
  return path.join(ariDir, org, repo);
};

export const writeRulesToProject = async (rules: RepoRules[]) => {
  const projectDir = getProjectDir();
  const rulesDir = path.join(projectDir, ".cursor", "rules");
  await fs.ensureDir(rulesDir);
  for (const rule of rules) {
    for (const relativeFilePath of rule.relativeFilePaths) {
      const centralRulePath = getCentralRepoRulePath(
        rule.org,
        rule.repo,
        relativeFilePath
      );
      const ruleContent = await fs.readFile(centralRulePath, "utf8");
      const rulePath = path.join(
        rulesDir,
        rule.org,
        rule.repo,
        relativeFilePath.categoryFolderName,
        relativeFilePath.fileName
      );
      fs.ensureFileSync(rulePath);
      fs.writeFileSync(rulePath, ruleContent);
    }
  }
};

const getCentralRepoRulePath = (
  org: string,
  repo: string,
  relativeFilePath: RuleFilePath
) => {
  return path.join(
    getAriHomeDir(),
    org,
    repo,
    "rules",
    relativeFilePath.categoryFolderName,
    relativeFilePath.fileName
  );
};

export const cloneRulesRepoIfNotExists = async (
  repoDir: string,
  repoUrl: string
) => {
  const repoDirExists = await directoryExists(repoDir);

  if (!repoDirExists) {
    warningMessage(`Cloning repository from ${repoUrl}...`);
    await cloneRepo(repoUrl, repoDir);
  } else {
    happyMessage("Repository already exists.");
  }
};

export const removeMissingCentralRulesFromAriYaml = (
  selectedRules: SelectedRules,
  centralRules: RepoRules[]
): SelectedRules => ({
  include: excludeRulesNotInCentralRules(selectedRules.include, centralRules),
  exclude: excludeRulesNotInCentralRules(selectedRules.exclude, centralRules),
});

const excludeRulesNotInCentralRules = (
  repoRules: RepoRules[],
  centralRules: RepoRules[]
): RepoRules[] => {
  return repoRules
    .map((rule) => {
      const updatedRelativeFilePaths = rule.relativeFilePaths.filter(
        (relativeFilePath) => {
          const ruleIncludedCentrally = centralRuleIncludesRule(
            centralRules,
            rule.org,
            rule.repo,
            relativeFilePath
          );
          if (!ruleIncludedCentrally) {
            warningMessage(
              `The following rules in your configuration are not found in the central repository ` +
                `and will be removed from .ari.yaml, but the rule files will remain in your project: ` +
                `${relativeFilePath.categoryFolderName}/${relativeFilePath.fileName}`
            );
          }
          return ruleIncludedCentrally;
        }
      );
      return { ...rule, relativeFilePaths: updatedRelativeFilePaths };
    })
    .filter((rule) => rule.relativeFilePaths.length > 0);
};

const centralRuleIncludesRule = (
  centralRules: RepoRules[],
  org: string,
  repo: string,
  relativeFilePath: RuleFilePath
): boolean => {
  return _.some(
    centralRules,
    (centralRule) =>
      centralRule.org === org &&
      centralRule.repo === repo &&
      filePathsInclude(centralRule.relativeFilePaths, relativeFilePath)
  );
};

const filePathsInclude = (
  filePaths: RuleFilePath[],
  filePath: RuleFilePath
): boolean => {
  return _.some(
    filePaths,
    (fp) =>
      fp.fileName === filePath.fileName &&
      fp.categoryFolderName === filePath.categoryFolderName
  );
};
