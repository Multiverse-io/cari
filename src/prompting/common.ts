import { RuleFilePath, SelectedRules } from "~/utils/cari-yaml.js";
import { RepoRules } from "~/utils/cari-yaml.js";
import { FlatRepoRule, flattenRepoRule } from "~/utils/rules.js";
import _ from "lodash";
import { FlatSelectedRules } from "~/utils/rules.js";
import {
  DirectoryChoice,
  FileChoice,
  RepoChoice,
  UserChoice,
} from "./types.js";
import { PromptChoice } from "./types.js";

export const normaliseSelectedRules = (
  selectedRules: FlatSelectedRules
): SelectedRules => {
  return {
    include: normaliseFlatRepoRules(selectedRules.include),
    exclude: normaliseFlatRepoRules(selectedRules.exclude),
  };
};

export const normaliseFlatRepoRules = (
  flatRepoRules: FlatRepoRule[]
): RepoRules[] => {
  const byOrgAndRepo = _.groupBy(
    flatRepoRules,
    (rule) => `${rule.org}/${rule.repo}`
  );

  return Object.entries(byOrgAndRepo).map(([_, rules]) => {
    const [firstRule, ...remainingRules] = rules;
    const relativeFilePaths = rules.map((rule) => rule.relativeFilePath);
    return {
      org: firstRule.org,
      repo: firstRule.repo,
      relativeFilePaths,
    };
  });
};

export const flattenRepoRules = (centralRules: RepoRules[]): FlatRepoRule[] => {
  return centralRules.flatMap((rule) => flattenRepoRule(rule));
};

export const flattenSelectedRules = (
  selectedRules: SelectedRules
): FlatSelectedRules => {
  return {
    include: selectedRules.include.flatMap((rule) => flattenRepoRule(rule)),
    exclude: selectedRules.exclude.flatMap((rule) => flattenRepoRule(rule)),
  };
};

export const repoChoice = (
  org: string,
  repo: string,
  ruleRelativeFilePaths: RuleFilePath[]
): PromptChoice<RepoChoice> => ({
  name: `Whole repo: ${org}/${repo}`,
  value: {
    type: "repo",
    org,
    repo,
    ruleRelativeFilePaths,
  },
  short: `Repo: ${org}/${repo}`,
  disabled: false,
});

export const directoryChoice = (
  org: string,
  repo: string,
  directory: string,
  ruleRelativeFilePaths: RuleFilePath[]
): PromptChoice<DirectoryChoice> => ({
  name: `---> Whole directory: ${directory}`,
  value: {
    type: "directory",
    org,
    repo,
    directory: directory,
    ruleRelativeFilePaths,
  },
  short: `Dir: ${directory}`,
  disabled: false,
});

export const fileChoice = (
  org: string,
  repo: string,
  ruleRelativeFilePath: RuleFilePath
): PromptChoice<FileChoice> => ({
  name: `------> ${ruleRelativeFilePath.fileName}`,
  value: {
    type: "file",
    org,
    repo,
    ruleRelativeFilePaths: [ruleRelativeFilePath],
  },
  short: `File: ${ruleRelativeFilePath.fileName}`,
  disabled: false,
});

export const userChoicesToSelectedRules = (
  choices: UserChoice[],
  centralRulesToChooseFrom: FlatRepoRule[]
): FlatSelectedRules => {
  if (!choices || choices.length === 0) {
    return {
      include: [],
      exclude: centralRulesToChooseFrom,
    };
  }
  const allSelectedRuleFiles: FlatRepoRule[] = choices.flatMap((choice) =>
    choiceToFlatRepoRule(choice)
  );
  const distinctSelectedRuleFiles = Array.from(new Set(allSelectedRuleFiles));
  // Maintain the order of rules as they appear in centralRulesToChooseFrom
  return centralRulesToChooseFrom.reduce(
    (inclusionsAndExclusions, rule) => {
      const isRuleSelected = distinctSelectedRuleFiles.some((selectedRule) =>
        _.isEqual(selectedRule, rule)
      );
      if (isRuleSelected) {
        return {
          include: [...inclusionsAndExclusions.include, rule],
          exclude: inclusionsAndExclusions.exclude,
        };
      }
      return {
        include: inclusionsAndExclusions.include,
        exclude: [...inclusionsAndExclusions.exclude, rule],
      };
    },
    { include: [], exclude: [] } as FlatSelectedRules
  );
};

const choiceToFlatRepoRule = (choice: UserChoice): FlatRepoRule[] => {
  return choice.ruleRelativeFilePaths.map((ruleRelativeFilePath) => {
    switch (choice.type) {
      case "repo":
        return {
          org: choice.org,
          repo: choice.repo,
          relativeFilePath: ruleRelativeFilePath,
        };
      case "directory":
        return {
          org: choice.org,
          repo: choice.repo,
          relativeFilePath: ruleRelativeFilePath,
        };
      case "file":
        return {
          org: choice.org,
          repo: choice.repo,
          relativeFilePath: ruleRelativeFilePath,
        };
    }
  });
};
