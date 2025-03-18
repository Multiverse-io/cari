import {
  FlatRepoRule,
  flattenRepoRules as flattenRepoRule,
  FlatSelectedRules,
} from "./rules.js";
import { checkbox, input } from "@inquirer/prompts";
import { groupBy } from "./utils.js";
import _ from "lodash";
import { RepoRules, RuleFilePath, SelectedRules } from "./cari-yaml.js";

type PromptChoice<T extends UserChoice> = {
  name: string;
  value: T;
  short?: string;
  disabled?: boolean;
};

type UserChoice = RepoChoice | DirectoryChoice | FileChoice;

interface RepoChoice {
  type: "repo";
  org: string;
  repo: string;
  ruleRelativeFilePaths: RuleFilePath[];
}

interface DirectoryChoice {
  type: "directory";
  org: string;
  repo: string;
  directory: string;
  ruleRelativeFilePaths: RuleFilePath[];
}

interface FileChoice {
  type: "file";
  org: string;
  repo: string;
  ruleRelativeFilePaths: RuleFilePath[];
}

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

export const askUserToSelectRules = async (
  centralRules: RepoRules[],
  message: string = "Select the rules you want to install"
): Promise<SelectedRules> => {
  const availableChoices = getSelectRuleChoices(centralRules);
  const selectedChoices = await checkbox({
    message,
    choices: availableChoices,
    loop: false,
    pageSize: 20,
  });
  const flattenedCentralRules = flattenRepoRules(centralRules);
  const selectedRules = userChoicesToSelectedRules(
    selectedChoices,
    flattenedCentralRules
  );
  const normalisedSelectedRules = normaliseSelectedRules(selectedRules);
  return normalisedSelectedRules;
};

const normaliseSelectedRules = (
  selectedRules: FlatSelectedRules
): SelectedRules => {
  return {
    include: normaliseFlatRepoRules(selectedRules.include),
    exclude: normaliseFlatRepoRules(selectedRules.exclude),
  };
};

const normaliseFlatRepoRules = (flatRepoRules: FlatRepoRule[]): RepoRules[] => {
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

export const getSelectRuleChoices = (
  centralRules: RepoRules[]
): PromptChoice<UserChoice>[] => {
  const choices = [];
  for (const rule of centralRules) {
    choices.push(repoChoice(rule.org, rule.repo, rule.relativeFilePaths));
    const directories = filePathsToDirectories(
      rule.org,
      rule.repo,
      rule.relativeFilePaths
    );
    for (const directory of directories) {
      choices.push(
        directoryChoice(
          directory.org,
          directory.repo,
          directory.directory,
          directory.ruleRelativeFilePaths
        )
      );
      for (const filePath of directory.ruleRelativeFilePaths) {
        choices.push(fileChoice(directory.org, directory.repo, filePath));
      }
    }
  }
  return choices;
};

// Asks the user if they want to add new central rules that are
// not currently in the project. Returns a list with the updated
// selected rules - including the new rules and their existing project rules.
export const askUserIfTheyWantToAddNewCentralRules = async (
  projectsSelectedRules: SelectedRules,
  centralRules: RepoRules[]
): Promise<SelectedRules> => {
  const flattenedProjectRules = flattenSelectedRules(projectsSelectedRules);
  const allProjectRules = flattenedProjectRules.include.concat(
    flattenedProjectRules.exclude
  );

  const flattenedCentralRules = flattenRepoRules(centralRules);
  const newAvailableCentralRules = flattenedCentralRules.filter(
    (rule) =>
      !allProjectRules.some((projectRule) => _.isEqual(rule, projectRule))
  );
  if (newAvailableCentralRules.length === 0) {
    return projectsSelectedRules;
  }
  const updateRuleChoices = getUpdateRuleChoices(newAvailableCentralRules);
  const newSelectedChoices = await checkbox({
    message: "New rules available! Select the rules you want to add",
    choices: updateRuleChoices,
    loop: false,
    pageSize: 20,
  });
  const newSelectedRules = userChoicesToSelectedRules(
    newSelectedChoices,
    newAvailableCentralRules
  );
  const updatedSelectedRules = {
    include: [...flattenedProjectRules.include, ...newSelectedRules.include],
    exclude: [...flattenedProjectRules.exclude, ...newSelectedRules.exclude],
  };
  const normalisedSelectedRules = normaliseSelectedRules(updatedSelectedRules);
  return normalisedSelectedRules;
};

export const getUpdateRuleChoices = (
  newAvailableCentralRules: FlatRepoRule[]
): PromptChoice<FileChoice>[] => {
  return newAvailableCentralRules.map((rule) => {
    return {
      name: `${rule.org}/${rule.repo} --> ${rule.relativeFilePath.categoryFolderName}/${rule.relativeFilePath.fileName}`,
      value: {
        type: "file",
        org: rule.org,
        repo: rule.repo,
        ruleRelativeFilePaths: [rule.relativeFilePath],
      },
      short: `${rule.relativeFilePath.categoryFolderName}/${rule.relativeFilePath.fileName}`,
      disabled: false,
    };
  });
};

interface Directory {
  org: string;
  repo: string;
  directory: string;
  ruleRelativeFilePaths: RuleFilePath[];
}

const filePathsToDirectories = (
  org: string,
  repo: string,
  filePaths: RuleFilePath[]
): Directory[] => {
  const groupedByDirectory = groupBy(filePaths, "categoryFolderName");
  return Object.entries(groupedByDirectory).map(([directory, paths]) => {
    return {
      org,
      repo,
      directory,
      ruleRelativeFilePaths: paths,
    };
  });
};

export const askUserToSelectRepos = async (): Promise<string[]> => {
  const repos: string[] = [];
  while (true) {
    const repoToAdd = await input({
      message: "Enter a rules repository URL (or press enter to finish)",
    });
    if (repoToAdd === "" || !repoToAdd) {
      break;
    }
    repos.push(repoToAdd);
  }
  return repos;
};

const flattenSelectedRules = (
  selectedRules: SelectedRules
): FlatSelectedRules => {
  return {
    include: selectedRules.include.flatMap((rule) => flattenRepoRule(rule)),
    exclude: selectedRules.exclude.flatMap((rule) => flattenRepoRule(rule)),
  };
};

const flattenRepoRules = (centralRules: RepoRules[]): FlatRepoRule[] => {
  return centralRules.flatMap((rule) => flattenRepoRule(rule));
};
