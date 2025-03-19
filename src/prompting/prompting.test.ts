import { describe, expect, it } from "vitest";
import { FlatRepoRule } from "../utils/rules.js";
import { getSelectRuleChoices } from "./init-prompts.js";
import { FlatSelectedRules } from "../utils/rules.js";
import {
  repoChoice,
  directoryChoice,
  fileChoice,
  userChoicesToSelectedRules,
} from "./common.js";

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

describe("userChoicesToSelectedRules", () => {
  const centralRules: FlatRepoRule[] = [
    {
      org: "my-org",
      repo: "my-repo",
      relativeFilePath: {
        categoryFolderName: "typescript",
        fileName: "rule-1.mdc",
      },
    },
    {
      org: "my-org",
      repo: "my-repo",
      relativeFilePath: {
        categoryFolderName: "typescript",
        fileName: "rule-2.mdc",
      },
    },
    {
      org: "my-other-org",
      repo: "my-other-repo",
      relativeFilePath: {
        categoryFolderName: "elixir",
        fileName: "rule-3.mdc",
      },
    },
    {
      org: "my-other-org",
      repo: "my-other-repo",
      relativeFilePath: {
        categoryFolderName: "elixir",
        fileName: "rule-4.mdc",
      },
    },
  ];

  it("should count repo choices as selecting all corresponding files", () => {
    const repoFilePaths = [
      {
        categoryFolderName: "typescript",
        fileName: "rule-1.mdc",
      },
      {
        categoryFolderName: "typescript",
        fileName: "rule-2.mdc",
      },
    ];

    const choices = [repoChoice("my-org", "my-repo", repoFilePaths).value];

    const result = userChoicesToSelectedRules(choices, centralRules);
    const expected: FlatSelectedRules = {
      include: [
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-1.mdc",
          },
        },
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-2.mdc",
          },
        },
      ],
      exclude: [
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-3.mdc",
          },
        },
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-4.mdc",
          },
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("should count directory choices as selecting all corresponding files", () => {
    const dirFilePaths = [
      {
        categoryFolderName: "typescript",
        fileName: "rule-1.mdc",
      },
      {
        categoryFolderName: "typescript",
        fileName: "rule-2.mdc",
      },
    ];

    const choices = [
      directoryChoice("my-org", "my-repo", "typescript", dirFilePaths).value,
    ];

    const result = userChoicesToSelectedRules(choices, centralRules);
    const expected: FlatSelectedRules = {
      include: [
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-1.mdc",
          },
        },
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-2.mdc",
          },
        },
      ],
      exclude: [
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-3.mdc",
          },
        },
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-4.mdc",
          },
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("should count file choices as selecting the corresponding file", () => {
    const filePath = {
      categoryFolderName: "typescript",
      fileName: "rule-1.mdc",
    };

    const choices = [fileChoice("my-org", "my-repo", filePath).value];

    const result = userChoicesToSelectedRules(choices, centralRules);
    const expected: FlatSelectedRules = {
      include: [
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-1.mdc",
          },
        },
      ],
      exclude: [
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-2.mdc",
          },
        },
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-3.mdc",
          },
        },
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-4.mdc",
          },
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("should remove duplicates from overlapping repo/directory/file choices", () => {
    const repoFilePaths = [
      {
        categoryFolderName: "typescript",
        fileName: "rule-1.mdc",
      },
      {
        categoryFolderName: "typescript",
        fileName: "rule-2.mdc",
      },
    ];

    const filePath = {
      categoryFolderName: "typescript",
      fileName: "rule-1.mdc",
    };

    const choices = [
      repoChoice("my-org", "my-repo", repoFilePaths).value,
      // File choice is redundant because it's already included in the repo choice
      fileChoice("my-org", "my-repo", filePath).value,
    ];

    const result = userChoicesToSelectedRules(choices, centralRules);
    const expected: FlatSelectedRules = {
      include: [
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-1.mdc",
          },
        },
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-2.mdc",
          },
        },
      ],
      exclude: [
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-3.mdc",
          },
        },
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-4.mdc",
          },
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("should add all rules which aren't selected to the exclude list", () => {
    const filePath = {
      categoryFolderName: "typescript",
      fileName: "rule-1.mdc",
    };

    const choices = [fileChoice("my-org", "my-repo", filePath).value];

    const result = userChoicesToSelectedRules(choices, centralRules);

    const expected: FlatSelectedRules = {
      include: [
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-1.mdc",
          },
        },
      ],
      exclude: [
        {
          org: "my-org",
          repo: "my-repo",
          relativeFilePath: {
            categoryFolderName: "typescript",
            fileName: "rule-2.mdc",
          },
        },
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-3.mdc",
          },
        },
        {
          org: "my-other-org",
          repo: "my-other-repo",
          relativeFilePath: {
            categoryFolderName: "elixir",
            fileName: "rule-4.mdc",
          },
        },
      ],
    };

    expect(result).toEqual(expected);
  });
});
