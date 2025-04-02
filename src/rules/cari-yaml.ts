import path from "path";
import fs from "fs-extra";
import yaml from "yaml";
import { errorMessage } from "../utils/user-message.js";
import { CariYaml } from "./types.js";
import { SelectedRules } from "./types.js";
import { cariYamlSchema } from "./types.js";
import { getHomeDir } from "../utils/file.js";
export const writeNewCariYamlFile = async (cariYaml: CariYaml) => {
  const cariYamlWithRelativePath = {
    ...cariYaml,
    repos: cariYaml.repos.map((repo) => ({
      ...repo,
      repoDir: path.relative(getHomeDir(), repo.repoDir),
    })),
  };
  const cariYamlPath = getCariYamlPath();
  fs.ensureFileSync(cariYamlPath);
  fs.writeFileSync(cariYamlPath, yaml.stringify(cariYamlWithRelativePath));
};

export const writeRulesToCariYaml = async (rules: SelectedRules) => {
  const cariYamlPath = getCariYamlPath();
  fs.ensureFileSync(cariYamlPath);

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
    const parsedYaml = cariYamlSchema.parse(yaml.parse(cariYaml));
    return {
      ...parsedYaml,
      repos: parsedYaml.repos.map((repo) => ({
        ...repo,
        repoDir: path.join(getHomeDir(), repo.repoDir),
      })),
    };
  } catch (error) {
    errorMessage(
      "Failed to parse existing .cari.yaml file. Please remove the file and run 'cari init' to re-initialize the project."
    );
    console.log({ error });
    return undefined;
  }
};

const getCariYamlPath = (projectDir: string = process.cwd()): string => {
  const cariYamlPath = path.join(projectDir, ".cari.yaml");
  return cariYamlPath;
};
