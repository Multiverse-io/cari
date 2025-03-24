import { happyMessage } from "../utils/user-message.js";
import { getCariYaml, writeRulesToCariYaml } from "../rules/cari-yaml.js";
import {
  updateAndGetCentralRulesFromAriYaml,
  removeMissingCentralRulesFromCariYaml,
  writeRulesToProject,
} from "../rules/rules.js";
import { askUserIfTheyWantToAddNewCentralRules } from "../prompting/update-prompts.js";
import { RepoRules } from "../rules/types.js";
import { CariYaml } from "../rules/types.js";

export const update = async (): Promise<void> => {
  happyMessage("Updating AI rules...");
  const cariYaml: CariYaml | undefined = await getCariYaml();
  if (!cariYaml) {
    return;
  }
  const centralRules: RepoRules[] = await updateAndGetCentralRulesFromAriYaml(
    cariYaml
  );
  const rules = removeMissingCentralRulesFromCariYaml(
    cariYaml.rules,
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
