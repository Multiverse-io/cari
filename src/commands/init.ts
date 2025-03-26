import { createAriHomeDirIfNotExists } from "../utils/file.js";
import { extractRepoDetails } from "../utils/git.js";
import {
  askUserToSelectRepos,
  askUserToSelectRules,
} from "../prompting/init-prompts.js";
import {
  cloneRulesRepoIfNotExists,
  getCentralRules,
  writeRulesToProject,
} from "../rules/rules.js";
import { writeNewCariYamlFile } from "../rules/cari-yaml.js";
import {
  errorMessage,
  happyMessage,
  warningMessage,
} from "../utils/user-message.js";
import { RepoRules, SelectedRules } from "~/rules/types.js";

/**
 * Initialize the AI Rules Installer
 */
export const init = async (): Promise<void> => {
  try {
    const repoUrls = await askUserToSelectRepos();
    await createAriHomeDirIfNotExists();
    const allRepoDetails = repoUrls.map((repoUrl) =>
      extractRepoDetails(repoUrl)
    );
    for (const repoDetails of allRepoDetails) {
      await cloneRulesRepoIfNotExists(repoDetails.repoDir, repoDetails.repoUrl);
    }
    const centralRules = await getCentralRules(allRepoDetails);
    const selectedRules = await askForRulesUntilUserIncludesAtLeastOneRule(
      centralRules
    );
    await writeNewCariYamlFile({
      repos: allRepoDetails,
      rules: selectedRules,
    });
    await writeRulesToProject(selectedRules.include);
    happyMessage("AI Rules Installer initialized successfully!");
  } catch (error) {
    errorMessage("Error initializing AI Rules Installer:");
    console.error(error);
    process.exit(1);
  }
};

const askForRulesUntilUserIncludesAtLeastOneRule = async (
  centralRules: RepoRules[]
): Promise<SelectedRules> => {
  let selectedRules = await askUserToSelectRules(centralRules);
  while (selectedRules.include.length === 0) {
    warningMessage(
      "No rules were selected to include. Please select at least one rule to include with <space> or press Ctrl-c to exit."
    );
    selectedRules = await askUserToSelectRules(centralRules);
  }
  return selectedRules;
};
