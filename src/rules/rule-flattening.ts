import { RepoRules, SelectedRules } from "~/utils/cari-yaml.js";
import _ from "lodash";
import { FlatRepoRule, FlatSelectedRules } from "./types.js";

export const flattenRepoRule = (repoRules: RepoRules): FlatRepoRule[] => {
  return repoRules.relativeFilePaths.map((relativeFilePath) => ({
    org: repoRules.org,
    repo: repoRules.repo,
    relativeFilePath,
  }));
};

export const normaliseSelectedRules = (
  selectedRules: FlatSelectedRules
): SelectedRules => {
  return {
    include: normaliseFlatRepoRules(selectedRules.include),
    exclude: normaliseFlatRepoRules(selectedRules.exclude),
  };
};

export const normaliseFlatRepoRules = (
  flatRepoRules: FlatRepoRule[]
): RepoRules[] => {
  const byOrgAndRepo = _.groupBy(
    flatRepoRules,
    (rule) => `${rule.org}/${rule.repo}`
  );

  return Object.entries(byOrgAndRepo).map(([_, rules]) => {
    const [firstRule, ...remainingRules] = rules;
    const relativeFilePaths = rules.map((rule) => rule.relativeFilePath);
    return {
      org: firstRule.org,
      repo: firstRule.repo,
      relativeFilePaths,
    };
  });
};

export const flattenRepoRules = (centralRules: RepoRules[]): FlatRepoRule[] => {
  return centralRules.flatMap((rule) => flattenRepoRule(rule));
};

export const flattenSelectedRules = (
  selectedRules: SelectedRules
): FlatSelectedRules => {
  return {
    include: selectedRules.include.flatMap((rule) => flattenRepoRule(rule)),
    exclude: selectedRules.exclude.flatMap((rule) => flattenRepoRule(rule)),
  };
};
