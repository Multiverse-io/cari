import { RepoConfig } from "../types/index.js";
import { happyMessage } from "~/utils/user-message.js";
import {
  getAriYaml,
  RepoRules,
  writeRulesToAriYaml,
} from "~/utils/ari-yaml.js";
import {
  updateAndGetCentralRulesFromAriYaml,
  removeMissingCentralRulesFromAriYaml,
  writeRulesToProject,
} from "~/utils/rules.js";
import { askUserIfTheyWantToAddNewCentralRules } from "~/utils/prompting.js";

export const update = async (): Promise<void> => {
  happyMessage("Updating AI rules...");
  const ariYaml = await getAriYaml();
  if (!ariYaml) {
    return;
  }
  const centralRules: RepoRules[] = await updateAndGetCentralRulesFromAriYaml(
    ariYaml.rules
  );
  const rules = removeMissingCentralRulesFromAriYaml(
    ariYaml.rules,
    centralRules
  );
  const updatedSelectedRules = await askUserIfTheyWantToAddNewCentralRules(
    rules,
    centralRules
  );
  await writeRulesToAriYaml(updatedSelectedRules);
  await writeRulesToProject(updatedSelectedRules.include);
  happyMessage("AI rules updated successfully");
};
