import { RuleFilePath } from "~/rules/types.js";
export type PromptChoice<T extends UserChoice> = {
  name: string;
  value: T;
  short?: string;
  disabled?: boolean;
};

export type UserChoice = RepoChoice | DirectoryChoice | FileChoice;

export interface RepoChoice {
  type: "repo";
  org: string;
  repo: string;
  ruleRelativeFilePaths: RuleFilePath[];
}

export interface DirectoryChoice {
  type: "directory";
  org: string;
  repo: string;
  directory: string;
  ruleRelativeFilePaths: RuleFilePath[];
}

export interface FileChoice {
  type: "file";
  org: string;
  repo: string;
  ruleRelativeFilePaths: RuleFilePath[];
}
