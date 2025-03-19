import { RuleFilePath } from "~/utils/cari-yaml.js";

export interface FlatSelectedRules {
  include: FlatRepoRule[];
  exclude: FlatRepoRule[];
}

export interface FlatRepoRule {
  org: string;
  repo: string;
  relativeFilePath: RuleFilePath;
}
