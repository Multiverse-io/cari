import path from "path";
import { FlatSelectedRules } from "./rules.js";
import fs from "fs-extra";
import yaml from "yaml";
import { getProjectDir } from "./file.js";
import { errorMessage } from "./user-message.js";
import { z } from "zod";

const relativeFilePathSchema = z.object({
  fileName: z.string(),
  categoryFolderName: z.string(),
});

const repoRuleSchema = z.object({
  org: z.string(),
  repo: z.string(),
  relativeFilePaths: z.array(relativeFilePathSchema),
});

const selectedRulesSchema = z.object({
  include: z.array(repoRuleSchema),
  exclude: z.array(repoRuleSchema),
});

const ariYamlSchema = z.object({
  rules: selectedRulesSchema,
});

export type AriYaml = z.TypeOf<typeof ariYamlSchema>;
export type SelectedRules = z.TypeOf<typeof selectedRulesSchema>;
export type RuleFilePath = z.TypeOf<typeof relativeFilePathSchema>;
export type RepoRules = z.TypeOf<typeof repoRuleSchema>;

export const writeRulesToAriYaml = async (selectedRules: SelectedRules) => {
  const ariYamlPath = getAriYamlPath();
  fs.ensureFileSync(ariYamlPath);

  let existingContent = {};
  const fileExists = fs.existsSync(ariYamlPath);
  const fileStats = fileExists ? fs.statSync(ariYamlPath) : null;

  if (fileExists && fileStats && fileStats.size > 0) {
    try {
      const existingYaml = fs.readFileSync(ariYamlPath, "utf8");
      existingContent = yaml.parse(existingYaml) || {};
    } catch (error) {
      console.warn(
        "Failed to parse existing .ari.yaml file, creating new one",
        error
      );
    }
  }

  const ariYamlContent = {
    ...existingContent,
    rules: selectedRules,
  };

  fs.writeFileSync(ariYamlPath, yaml.stringify(ariYamlContent));
};

export const getAriYaml = async (): Promise<AriYaml | undefined> => {
  const ariYamlPath = getAriYamlPath();
  if (!fs.existsSync(ariYamlPath)) {
    errorMessage(
      ".ari.yaml configuration file not found in the current directory. Please check that you're in the correct directory and run 'ari init' if needed."
    );
    return undefined;
  }
  try {
    const ariYaml = fs.readFileSync(ariYamlPath, "utf8");
    return ariYamlSchema.parse(yaml.parse(ariYaml));
  } catch (error) {
    errorMessage(
      "Failed to parse existing .ari.yaml file. Please remove the file and run 'ari init' to re-initialize the project."
    );
    return undefined;
  }
};

const getAriYamlPath = () => {
  const projectDir = getProjectDir();
  const ariYamlPath = path.join(projectDir, ".ari.yaml");
  return ariYamlPath;
};
