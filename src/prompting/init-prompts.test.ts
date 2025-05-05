import { describe, expect, it, vi, beforeEach } from "vitest";
import { directoryChoice, fileChoice, repoChoice } from "./common.js";
import { askUserToSelectRepos, getSelectRuleChoices } from "./init-prompts.js";
import { input } from "@inquirer/prompts";
import { ok, error, userInputError } from "../utils/result.js";

// Mock the input prompt
vi.mock("@inquirer/prompts", () => ({
  input: vi.fn(),
  checkbox: vi.fn(),
}));

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

describe("askUserToSelectRepos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a success result with repository URLs when valid repositories are provided", async () => {
    const repoUrl1 = "git@github.com:my-org/my-repo.git";
    const repoUrl2 = "git@github.com:my-other-org/my-other-repo.git";

    // Mock input to first return two repo URLs and then an empty string to finish
    vi.mocked(input).mockResolvedValueOnce(repoUrl1);
    vi.mocked(input).mockResolvedValueOnce(repoUrl2);
    vi.mocked(input).mockResolvedValueOnce("");

    const result = await askUserToSelectRepos();

    expect(result).toEqual(ok([repoUrl1, repoUrl2]));
    expect(input).toHaveBeenCalledTimes(3);
  });

  it("should return an error result when no repositories are provided", async () => {
    // Mock input to immediately return an empty string (user doesn't add any repos)
    vi.mocked(input).mockResolvedValueOnce("");

    const result = await askUserToSelectRepos();

    expect(result).toEqual(
      error(
        userInputError(
          "No repositories were added. Please try again and enter at least one repository URL."
        )
      )
    );
    expect(input).toHaveBeenCalledTimes(1);
  });
});
