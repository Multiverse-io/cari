import path from "path";
import fs from "fs-extra";
import yaml from "yaml";
import { z } from "zod";
import { errorMessage } from "./user-message.js";

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

const repoSchema = z.object({
  orgName: z.string(),
  repoName: z.string(),
  repoDir: z.string(),
  repoUrl: z.string(),
});

const cariYamlSchema = z.object({
  repos: z.array(repoSchema),
  rules: selectedRulesSchema,
});

export type CariYaml = z.TypeOf<typeof cariYamlSchema>;
export type SelectedRules = z.TypeOf<typeof selectedRulesSchema>;
export type RuleFilePath = z.TypeOf<typeof relativeFilePathSchema>;
export type RepoRules = z.TypeOf<typeof repoRuleSchema>;

export const writeNewCariYamlFile = async (cariYaml: CariYaml) => {
  const cariYamlPath = getCariYamlPath();
  fs.ensureFileSync(cariYamlPath);
  fs.writeFileSync(cariYamlPath, yaml.stringify(cariYaml));
};

export const writeRulesToCariYaml = async (rules: SelectedRules) => {
  const cariYamlPath = getCariYamlPath();
  fs.ensureFileSync(cariYamlPath);

  const fileExists = fs.existsSync(cariYamlPath);
  const fileStats = fileExists ? fs.statSync(cariYamlPath) : null;

  try {
    const existingYaml = fs.readFileSync(cariYamlPath, "utf8");
    const parsedYaml = cariYamlSchema.parse(yaml.parse(existingYaml));
    const updatedYaml = { ...parsedYaml, rules };
    fs.writeFileSync(cariYamlPath, yaml.stringify(updatedYaml));
  } catch (error) {
    errorMessage("Failed to parse existing .cari.yaml file, creating new one");
    const cariYamlContent = {
      rules,
      repos: {},
    };
    fs.writeFileSync(cariYamlPath, yaml.stringify(cariYamlContent));
  }
};

export const getCariYaml = async (): Promise<CariYaml | undefined> => {
  const cariYamlPath = getCariYamlPath();
  if (!fs.existsSync(cariYamlPath)) {
    errorMessage(
      ".cari.yaml configuration file not found in the current directory. Please check that you're in the correct directory and run 'cari init' if needed."
    );
    return undefined;
  }

  try {
    const cariYaml = fs.readFileSync(cariYamlPath, "utf8");
    return cariYamlSchema.parse(yaml.parse(cariYaml));
  } catch (error) {
    errorMessage(
      "Failed to parse existing .cari.yaml file. Please remove the file and run 'cari init' to re-initialize the project."
    );
    return undefined;
  }
};

const getCariYamlPath = (projectDir: string = process.cwd()): string => {
  const cariYamlPath = path.join(projectDir, ".cari.yaml");
  return cariYamlPath;
};
