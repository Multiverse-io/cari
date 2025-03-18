import fs from "fs-extra";
import path from "path";
import os from "os";
import { warningMessage } from "./user-message.js";

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
export const getAriHomeDir = (): string => {
  return path.join(getHomeDir(), ".cari");
};

/**
 * Creates the ARI home directory if it doesn't already exist
 *
 * This function checks if the .cari directory exists in the user's home directory.
 * If it doesn't exist, it creates the directory and logs a message to the console.
 *
 * @returns {Promise<void>} A promise that resolves when the directory check/creation is complete
 */
export const createAriHomeDirIfNotExists = async (): Promise<void> => {
  const ariDir = getAriHomeDir();
  const ariDirExists = await directoryExists(ariDir);
  if (!ariDirExists) {
    warningMessage(`Creating .cari directory at ${ariDir}`);
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
