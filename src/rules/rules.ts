import path from "path";
import {
  directoryExists,
  getAriHomeDir,
  getProjectDir,
} from "../utils/file.js";
import fs from "fs-extra";
import { glob } from "glob";
import {
  cloneRepo,
  pullLatestChanges,
  SimpleRepoDetails,
} from "../utils/git.js";
import { happyMessage } from "../utils/user-message.js";
import { warningMessage } from "../utils/user-message.js";
import _ from "lodash";
import { RepoRules, RuleFilePath, SelectedRules, CariYaml } from "./types.js";

export const getCentralRules = async (
  repoDetails: SimpleRepoDetails[]
): Promise<RepoRules[]> => {
  return repoDetails.map((repoDetail) => {
    const { orgName, repoName, repoDir } = repoDetail;
    const rulesPattern = path.join(repoDir, "rules", "**", "*.mdc");
    const relativeFilePaths = glob.sync(rulesPattern);

    if (relativeFilePaths.length === 0) {
      warningMessage(`No rules found in repo: ${orgName}/${repoName}`);
    }

    const fileNames = relativeFilePaths.map((filePath) => {
      const fileName = path.basename(filePath);
      const rulesDir = path.join(repoDir, "rules");
      const fileDir = path.dirname(filePath);
      const categoryFolderName =
        fileDir === rulesDir ? "" : path.relative(rulesDir, fileDir);
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
  ariYaml: CariYaml
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
      const rulePath = path.join(
        rulesDir,
        rule.org,
        rule.repo,
        relativeFilePath.categoryFolderName,
        relativeFilePath.fileName
      );
      await fs.ensureDir(path.dirname(rulePath));
      await fs.copy(centralRulePath, rulePath);
    }
  }
};

const getCentralRepoRulePath = (
  org: string,
  repo: string,
  relativeFilePath: RuleFilePath
) => {
  const basePath = path.join(getAriHomeDir(), org, repo, "rules");

  return path.join(
    basePath,
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

export const removeMissingCentralRulesFromCariYaml = (
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
                `and will be removed from .cari.yaml, but the rule files will remain in your project: ` +
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
