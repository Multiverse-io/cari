import { z } from "zod";

export const relativeFilePathSchema = z.object({
  fileName: z.string(),
  categoryFolderName: z.string(),
});

export const repoRuleSchema = z.object({
  org: z.string(),
  repo: z.string(),
  relativeFilePaths: z.array(relativeFilePathSchema),
});

export const selectedRulesSchema = z.object({
  include: z.array(repoRuleSchema),
  exclude: z.array(repoRuleSchema),
});

export const repoSchema = z.object({
  orgName: z.string(),
  repoName: z.string(),
  repoDir: z.string(),
  repoUrl: z.string(),
});

export const cariYamlSchema = z.object({
  repos: z.array(repoSchema),
  rules: selectedRulesSchema,
});

export type CariYaml = z.TypeOf<typeof cariYamlSchema>;
export type SelectedRules = z.TypeOf<typeof selectedRulesSchema>;
export type RuleFilePath = z.TypeOf<typeof relativeFilePathSchema>;
export type RepoRules = z.TypeOf<typeof repoRuleSchema>;
export interface FlatSelectedRules {
  include: FlatRepoRule[];
  exclude: FlatRepoRule[];
}

export interface FlatRepoRule {
  org: string;
  repo: string;
  relativeFilePath: RuleFilePath;
}
