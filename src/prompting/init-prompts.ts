import { checkbox, input } from "@inquirer/prompts";
import _ from "lodash";
import { PromptChoice, UserChoice } from "./types.js";
import {
  directoryChoice,
  fileChoice,
  repoChoice,
  userChoicesToSelectedRules,
} from "./common.js";
import {
  flattenRepoRules,
  normaliseSelectedRules,
} from "../rules/rule-flattening.js";
import { RepoRules, RuleFilePath, SelectedRules } from "../rules/types.js";
import {
  error,
  ok,
  Result,
  userInputError,
  UserInputError,
} from "../utils/result.js";

export const askUserToSelectRepos = async (): Promise<
  Result<string[], UserInputError>
> => {
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
  if (repos.length === 0) {
    return error(
      userInputError(
        "No repositories were added. Please try again and enter at least one repository URL."
      )
    );
  }
  return ok(repos);
};

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

const filePathsToDirectories = (
  org: string,
  repo: string,
  filePaths: RuleFilePath[]
): Directory[] => {
  const groupedByDirectory = _.groupBy(filePaths, "categoryFolderName");
  return Object.entries(groupedByDirectory).map(([directory, paths]) => {
    return {
      org,
      repo,
      directory,
      ruleRelativeFilePaths: paths,
    };
  });
};
interface Directory {
  org: string;
  repo: string;
  directory: string;
  ruleRelativeFilePaths: RuleFilePath[];
}
