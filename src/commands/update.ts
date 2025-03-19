import { happyMessage } from "~/utils/user-message.js";
import {
  CariYaml,
  getCariYaml,
  RepoRules,
  writeRulesToCariYaml,
} from "~/utils/cari-yaml.js";
import {
  updateAndGetCentralRulesFromAriYaml,
  removeMissingCentralRulesFromAriYaml,
  writeRulesToProject,
} from "~/rules/rules.js";
import { askUserIfTheyWantToAddNewCentralRules } from "~/prompting/update-prompts.js";

export const update = async (): Promise<void> => {
  happyMessage("Updating AI rules...");
  const ariYaml: CariYaml | undefined = await getCariYaml();
  if (!ariYaml) {
    return;
  }
  const centralRules: RepoRules[] = await updateAndGetCentralRulesFromAriYaml(
    ariYaml
  );
  const rules = removeMissingCentralRulesFromAriYaml(
    ariYaml.rules,
    centralRules
  );
  const updatedSelectedRules = await askUserIfTheyWantToAddNewCentralRules(
    rules,
    centralRules
  );
  await writeRulesToCariYaml(updatedSelectedRules);
  await writeRulesToProject(updatedSelectedRules.include);
  happyMessage("AI rules updated successfully");
};
