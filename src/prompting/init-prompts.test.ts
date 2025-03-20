import { describe, expect, it } from "vitest";
import { directoryChoice, fileChoice, repoChoice } from "./common.js";
import { getSelectRuleChoices } from "./init-prompts.js";

describe("getSelectRuleChoices", () => {
  it("should return a list of choices", () => {
    const centralRules = [
      {
        org: "my-org",
        repo: "my-repo",
        relativeFilePaths: [
          {
            categoryFolderName: "typescript",
            fileName: "rule-1.mdc",
          },
          {
            categoryFolderName: "typescript",
            fileName: "rule-2.mdc",
          },
        ],
      },
      {
        org: "my-other-org",
        repo: "my-other-repo",
        relativeFilePaths: [
          {
            categoryFolderName: "elixir",
            fileName: "rule-3.mdc",
          },
          {
            categoryFolderName: "elixir",
            fileName: "rule-4.mdc",
          },
        ],
      },
    ];
    const choices = getSelectRuleChoices(centralRules);
    expect(choices).toEqual([
      repoChoice("my-org", "my-repo", [
        {
          categoryFolderName: "typescript",
          fileName: "rule-1.mdc",
        },
        {
          categoryFolderName: "typescript",
          fileName: "rule-2.mdc",
        },
      ]),
      directoryChoice("my-org", "my-repo", "typescript", [
        {
          categoryFolderName: "typescript",
          fileName: "rule-1.mdc",
        },
        {
          categoryFolderName: "typescript",
          fileName: "rule-2.mdc",
        },
      ]),
      fileChoice("my-org", "my-repo", {
        categoryFolderName: "typescript",
        fileName: "rule-1.mdc",
      }),
      fileChoice("my-org", "my-repo", {
        categoryFolderName: "typescript",
        fileName: "rule-2.mdc",
      }),
      repoChoice("my-other-org", "my-other-repo", [
        {
          categoryFolderName: "elixir",
          fileName: "rule-3.mdc",
        },
        {
          categoryFolderName: "elixir",
          fileName: "rule-4.mdc",
        },
      ]),
      directoryChoice("my-other-org", "my-other-repo", "elixir", [
        {
          categoryFolderName: "elixir",
          fileName: "rule-3.mdc",
        },
        {
          categoryFolderName: "elixir",
          fileName: "rule-4.mdc",
        },
      ]),
      fileChoice("my-other-org", "my-other-repo", {
        categoryFolderName: "elixir",
        fileName: "rule-3.mdc",
      }),
      fileChoice("my-other-org", "my-other-repo", {
        categoryFolderName: "elixir",
        fileName: "rule-4.mdc",
      }),
    ]);
  });
});
