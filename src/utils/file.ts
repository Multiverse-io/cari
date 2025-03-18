import fs from "fs-extra";
import path from "path";
import os from "os";
import { glob } from "glob";
import { Rule } from "../types/index.js";
import chalk from "chalk";

/**
 * Get the current working directory of the project
 *
 * This function returns the directory from which the Node.js process was launched,
 * which is typically the root directory of the user's project.
 *
 * @returns {string} The absolute path to the current project directory
 */
export const getProjectDir = (): string => {
  const projectDir = process.cwd();
  return projectDir;
};

/**
 * Get the user's home directory
 */
export const getHomeDir = (): string => {
  return os.homedir();
};

/**
 * Get the ARI directory path
 */
export const getAriDir = (): string => {
  return path.join(getHomeDir(), ".ari");
};

/**
 * Creates the ARI home directory if it doesn't already exist
 *
 * This function checks if the .ari directory exists in the user's home directory.
 * If it doesn't exist, it creates the directory and logs a message to the console.
 *
 * @returns {Promise<void>} A promise that resolves when the directory check/creation is complete
 */
export const createAriHomeDirIfNotExists = async (): Promise<void> => {
  const ariDir = getAriDir();
  const ariDirExists = await directoryExists(ariDir);
  if (!ariDirExists) {
    console.log(chalk.yellow(`Creating .ari directory at ${ariDir}`));
    await ensureDirectoryExists(ariDir);
  }
};

/**
 * Get the rules directory path for a specific repository
 */
export const getRepoRulesDir = (repoDir: string): string => {
  return path.join(repoDir, "rules");
};

/**
 * Check if a directory exists
 */
export const directoryExists = async (dirPath: string): Promise<boolean> => {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
};

/**
 * Create a directory if it doesn't exist
 */
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  await fs.ensureDir(dirPath);
};

/**
 * Create an empty file if it doesn't exist
 */
export const ensureFileExists = async (filePath: string): Promise<void> => {
  await fs.ensureFile(filePath);
};

/**
 * Find all rule files in a specific repository
 */
export const findRepoRuleFiles = async (repoDir: string): Promise<string[]> => {
  const rulesDir = getRepoRulesDir(repoDir);
  return glob.sync(`${rulesDir}/**/*.mdc`);
};

/**
 * Extract rule information from file paths with repository URL
 */
export const extractRuleInfoWithRepo = async (
  filePaths: string[],
  repoUrl: string
): Promise<Rule[]> => {
  const rules: Rule[] = [];

  for (const filePath of filePaths) {
    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      const firstLine = fileContent.split("\n")[0];

      // Extract the rule name from the file path
      const rulesDir = path.dirname(filePath).includes("rules")
        ? path.dirname(filePath).split("rules")[1]
        : "";
      const fileName = path.basename(filePath, ".mdc");
      const ruleName = rulesDir
        ? `${rulesDir}/${fileName}`.replace(/\\/g, "/")
        : `/${fileName}`;

      // Extract the description from the first line if it's a markdown heading
      const description = firstLine.startsWith("#")
        ? firstLine.replace(/^#\s+/, "")
        : undefined;

      rules.push({
        path: filePath,
        name: ruleName,
        description,
        repoUrl,
      });
    } catch (error) {
      console.error(`Error processing rule file ${filePath}:`, error);
    }
  }

  return rules;
};

/**
 * Extract rule information from file paths (for backward compatibility)
 */
export const extractRuleInfo = async (filePaths: string[]): Promise<Rule[]> => {
  return extractRuleInfoWithRepo(
    filePaths,
    "git@github.com:Multiverse-io/ai-rules.git"
  );
};

/**
 * Get the flattened rule path for a specific repository
 */
export const getFlattenedRulePathForRepo = (
  rulePath: string,
  destDir: string,
  repoUrl: string
): string => {
  // Extract the organization and repository name from the URL
  const repoDirectoryName =
    repoUrl.split("/").pop()?.replace(".git", "") || "ai-rules";
  const orgMatch = repoUrl.match(/[:/]([^/]+)\/[^/]+\.git$/);
  const orgName = orgMatch ? orgMatch[1] : "default-org";

  // Get the rule file name
  const fileName = path.basename(rulePath);

  // Get the relative path from the rules directory
  const rulesDir = getRepoRulesDir(path.dirname(path.dirname(rulePath)));
  const relativePath = path.relative(rulesDir, rulePath);

  // Replace path separators with dashes for the flattened name
  const flattenedPath = relativePath.replace(/\\/g, "/").split("/").join("--");

  // Create a unique name with org and repo prefixes
  const uniqueName = `${orgName}--${repoDirectoryName}--${flattenedPath}`;

  return path.join(destDir, uniqueName);
};

/**
 * Get the flattened rule path (for backward compatibility)
 */
export const getFlattenedRulePath = (
  rulePath: string,
  destDir: string
): string => {
  return getFlattenedRulePathForRepo(
    rulePath,
    destDir,
    "git@github.com:Multiverse-io/ai-rules.git"
  );
};

/**
 * Organize rule files by directory structure
 * @param filePaths Array of file paths
 * @returns Object with directory structure
 */
export interface RuleTreeNode {
  path: string;
  name: string;
  description?: string;
  type: "file" | "directory";
  children?: RuleTreeNode[];
}
