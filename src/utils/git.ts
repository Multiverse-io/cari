import { simpleGit, SimpleGit } from "simple-git";
import { getAriHomeDir } from "./file.js";
import path from "path";
import { getCentralRepoDir } from "../rules/rules.js";

export interface RepoDetails {
  repoUrl: string;
  repoDir: string;
  repoName: string;
  orgName: string;
}

export interface SimpleRepoDetails {
  repoDir: string;
  repoName: string;
  orgName: string;
}

/**
 * Get the repository directory name from a repository URL
 */
const extractOrgAndRepoFromRepoUrl = (
  repoUrl: string
): {
  orgName: string;
  repoName: string;
} => {
  const repoName = repoUrl.split("/").pop()?.replace(".git", "")!;

  const orgMatch = repoUrl.match(/[:/]([^/]+)\/[^/]+(?:\.git)?$/);
  const orgName = orgMatch ? orgMatch[1] : "default-org";

  return {
    orgName,
    repoName,
  };
};

/**
 * Get the central rules repository directory path
 */
export const extractRepoDetails = (repoUrl: string): RepoDetails => {
  const ariDir = getAriHomeDir();
  const { orgName, repoName } = extractOrgAndRepoFromRepoUrl(repoUrl);
  const repoDir = getCentralRepoDir(ariDir, orgName, repoName);
  return {
    repoUrl,
    repoDir,
    repoName,
    orgName,
  };
};

/**
 * Clone a repository
 */
export const cloneRepo = async (
  repoUrl: string,
  repoDir: string
): Promise<void> => {
  try {
    const git: SimpleGit = simpleGit();
    await git.clone(repoUrl, repoDir);
    console.log(`Successfully cloned repository: ${repoUrl}`);
  } catch (error) {
    console.error(`Failed to clone repository ${repoUrl}:`, error);
    throw new Error(
      "Failed to clone repository. Please check your internet connection and Git credentials."
    );
  }
};

/**
 * Pull the latest changes from a repository
 */
export const pullLatestChanges = async (repoDir: string): Promise<void> => {
  try {
    const git: SimpleGit = simpleGit(repoDir);
    await git.pull();
  } catch (error) {
    console.error("Failed to pull latest changes:", error);
    throw new Error(
      "Failed to pull latest changes. Please check your internet connection and Git credentials."
    );
  }
};
