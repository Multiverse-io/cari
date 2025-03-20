import _ from "lodash";
import { userChoicesToSelectedRules } from "./common.js";
import { checkbox } from "@inquirer/prompts";
import { PromptChoice } from "./types.js";
import { FileChoice } from "./types.js";
import {
  flattenSelectedRules,
  normaliseSelectedRules,
} from "~/rules/rule-flattening.js";
import { flattenRepoRules } from "~/rules/rule-flattening.js";
import { FlatRepoRule, RepoRules, SelectedRules } from "~/rules/types.js";

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
