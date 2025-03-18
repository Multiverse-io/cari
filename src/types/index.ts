/**
 * Configuration file structure
 */
export interface AriConfig {
  /**
   * Repositories configuration
   */
  repos: RepoConfig[];
}

/**
 * Repository configuration
 */
export interface RepoConfig {
  /**
   * URL of the repository
   */
  url: string;

  /**
   * Rules configuration for this repository
   */
  rules: {
    /**
     * Rules to include in the project
     */
    include: string[];

    /**
     * Rules to exclude from the project
     */
    exclude: string[];
  };
}

/**
 * Rule information
 */
export interface Rule {
  /**
   * Path to the rule file
   */
  path: string;

  /**
   * Name of the rule (filename without extension)
   */
  name: string;

  /**
   * Description of the rule (if available)
   */
  description?: string;

  /**
   * Repository URL this rule belongs to
   */
  repoUrl?: string;
}
