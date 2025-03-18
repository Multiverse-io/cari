import { createAriHomeDirIfNotExists } from "../utils/file.js";
import { extractRepoDetails } from "../utils/git.js";
import {
  askUserToSelectRepos,
  askUserToSelectRules,
} from "../utils/prompting.js";
import {
  cloneRulesRepoIfNotExists,
  getCentralRules,
  writeRulesToProject,
} from "../utils/rules.js";
import { writeRulesToAriYaml } from "../utils/ari-yaml.js";
import { errorMessage, happyMessage } from "../utils/user-message.js";

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
    const selectedRules = await askUserToSelectRules(centralRules);
    await writeRulesToAriYaml(selectedRules);
    await writeRulesToProject(selectedRules.include);
    happyMessage("AI Rules Installer initialized successfully!");
  } catch (error) {
    errorMessage("Error initializing AI Rules Installer:");
    console.error(error);
    process.exit(1);
  }
};
