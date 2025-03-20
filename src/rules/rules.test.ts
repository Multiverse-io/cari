import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCentralRules, writeRulesToProject } from "./rules.js";
import mockFs from "mock-fs";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { RepoRules } from "./types.js";
import { removeMissingCentralRulesFromCariYaml } from "./rules.js";

const projectDir = "/home/user/my-project";

const mockWarningMessage = vi.hoisted(() => {
  return vi.fn();
});

vi.mock("../utils/user-message.js", () => ({
  warningMessage: mockWarningMessage,
}));

beforeEach(() => {
  vi.spyOn(process, "cwd").mockReturnValue(projectDir);
  vi.spyOn(os, "homedir").mockReturnValue("/home/user");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("writeRulesToProject", () => {
  it("should create the .cursor/rules directory if it doesn't exist", async () => {
    mockFs({
      "/home/user/my-project/": {},
    });
    await writeRulesToProject([]);
    expect(
      fs.existsSync(path.join("/home/user/my-project/", ".cursor/rules"))
    ).toBe(true);
  });

  it("should write the rules to the project", async () => {
    mockFs({
      [projectDir]: {},
      "/home/user/.cari/org/repo/rules/category/rule.mdc": "some rule content",
      "/home/user/.cari/my-org/typescript-ai-rules/rules/some-rule-category/some-rule.mdc":
        "some more rule content",
    });
    const rules: RepoRules[] = [
      {
        org: "org",
        repo: "repo",
        relativeFilePaths: [
          {
            fileName: "rule.mdc",
            categoryFolderName: "category",
          },
        ],
      },
      {
        org: "my-org",
        repo: "typescript-ai-rules",
        relativeFilePaths: [
          {
            fileName: "some-rule.mdc",
            categoryFolderName: "some-rule-category",
          },
        ],
      },
    ];
    await writeRulesToProject(rules);
    expect(
      fs.readFileSync(
        path.join(projectDir, ".cursor/rules/org/repo/category/rule.mdc"),
        "utf8"
      )
    ).toBe("some rule content");
    expect(
      fs.readFileSync(
        path.join(
          projectDir,
          ".cursor/rules/my-org/typescript-ai-rules/some-rule-category/some-rule.mdc"
        ),
        "utf8"
      )
    ).toBe("some more rule content");
  });
});

describe("getCentralRules", () => {
  it("should return the central rules", async () => {
    const mockFolderStructure = {
      "/home/user/.cari/my-org/elixir-ai-rules": {
        rules: {
          "ecto-rules": {
            "ecto-rule-1.mdc": "some rule content",
            "ecto-rule-2.mdc": "some other rule content",
          },
        },
      },
      "/home/user/.cari/my-org/typescript-ai-rules": {
        rules: {
          "some-rule-category": {
            "some-rule.mdc": "some rule content",
          },
        },
      },
      // Should be ignored as in hidden .git folder
      "/home/user/.cari/.git": {
        rules: {
          "some-rule-category": {
            "some-rule.mdc": "some rule content",
          },
        },
      },
    };

    mockFs(mockFolderStructure);
    const centralRules = await getCentralRules([
      {
        orgName: "my-org",
        repoName: "elixir-ai-rules",
        repoDir: "/home/user/.cari/my-org/elixir-ai-rules",
      },
      {
        orgName: "my-org",
        repoName: "typescript-ai-rules",
        repoDir: "/home/user/.cari/my-org/typescript-ai-rules",
      },
    ]);
    expect(centralRules).toEqual([
      {
        org: "my-org",
        repo: "elixir-ai-rules",
        relativeFilePaths: [
          {
            fileName: "ecto-rule-2.mdc",
            categoryFolderName: "ecto-rules",
          },
          {
            fileName: "ecto-rule-1.mdc",
            categoryFolderName: "ecto-rules",
          },
        ],
      },
      {
        org: "my-org",
        repo: "typescript-ai-rules",
        relativeFilePaths: [
          {
            fileName: "some-rule.mdc",
            categoryFolderName: "some-rule-category",
          },
        ],
      },
    ]);
  });

  it("should log a warning when a repo has no rules", async () => {
    const mockFolderStructure = {
      "/home/user/.cari/my-org/empty-repo": {
        // Empty repo with no rules
      },
    };

    mockFs(mockFolderStructure);
    await getCentralRules([
      {
        orgName: "my-org",
        repoName: "empty-repo",
        repoDir: "/home/user/.cari/my-org/empty-repo",
      },
    ]);

    expect(mockWarningMessage.mock.calls[0]).toContain(
      "No rules found in repo: my-org/empty-repo"
    );
  });
});

describe("removeMissingCentralRulesFromCariYaml", () => {
  it("should keep rules that exist in central rules", () => {
    const selectedRules = {
      include: [
        {
          org: "my-org",
          repo: "typescript-ai-rules",
          relativeFilePaths: [
            {
              fileName: "some-rule.mdc",
              categoryFolderName: "some-rule-category",
            },
          ],
        },
      ],
      exclude: [],
    };

    const centralRules = [
      {
        org: "my-org",
        repo: "typescript-ai-rules",
        relativeFilePaths: [
          {
            fileName: "some-rule.mdc",
            categoryFolderName: "some-rule-category",
          },
        ],
      },
    ];

    const result = removeMissingCentralRulesFromCariYaml(
      selectedRules,
      centralRules
    );

    expect(result).toEqual(selectedRules);
  });

  it("should remove rules that don't exist in central rules", () => {
    const selectedRules = {
      include: [
        {
          org: "my-org",
          repo: "typescript-ai-rules",
          relativeFilePaths: [
            {
              fileName: "some-rule.mdc",
              categoryFolderName: "some-rule-category",
            },
            {
              fileName: "non-existent-rule.mdc",
              categoryFolderName: "some-rule-category",
            },
          ],
        },
      ],
      exclude: [],
    };

    const centralRules = [
      {
        org: "my-org",
        repo: "typescript-ai-rules",
        relativeFilePaths: [
          {
            fileName: "some-rule.mdc",
            categoryFolderName: "some-rule-category",
          },
        ],
      },
    ];

    const result = removeMissingCentralRulesFromCariYaml(
      selectedRules,
      centralRules
    );

    expect(result.include[0].relativeFilePaths).toHaveLength(1);
    expect(result.include[0].relativeFilePaths[0].fileName).toBe(
      "some-rule.mdc"
    );
  });

  it("should handle empty selected rules", () => {
    const selectedRules = {
      include: [],
      exclude: [],
    };

    const centralRules = [
      {
        org: "my-org",
        repo: "typescript-ai-rules",
        relativeFilePaths: [
          {
            fileName: "some-rule.mdc",
            categoryFolderName: "some-rule-category",
          },
        ],
      },
    ];

    const result = removeMissingCentralRulesFromCariYaml(
      selectedRules,
      centralRules
    );

    expect(result).toEqual(selectedRules);
  });

  it("should handle rules from different repos", () => {
    const selectedRules = {
      include: [
        {
          org: "my-org",
          repo: "typescript-ai-rules",
          relativeFilePaths: [
            {
              fileName: "some-rule.mdc",
              categoryFolderName: "some-rule-category",
            },
          ],
        },
        {
          org: "other-org",
          repo: "other-rules",
          relativeFilePaths: [
            {
              fileName: "other-rule.mdc",
              categoryFolderName: "other-category",
            },
          ],
        },
      ],
      exclude: [],
    };

    const centralRules = [
      {
        org: "my-org",
        repo: "typescript-ai-rules",
        relativeFilePaths: [
          {
            fileName: "some-rule.mdc",
            categoryFolderName: "some-rule-category",
          },
        ],
      },
    ];

    const result = removeMissingCentralRulesFromCariYaml(
      selectedRules,
      centralRules
    );

    expect(result.include).toHaveLength(1);
    expect(result.include[0].org).toBe("my-org");
  });

  it("should handle both include and exclude rules", () => {
    const selectedRules = {
      include: [
        {
          org: "my-org",
          repo: "typescript-ai-rules",
          relativeFilePaths: [
            {
              fileName: "some-rule.mdc",
              categoryFolderName: "some-rule-category",
            },
          ],
        },
      ],
      exclude: [
        {
          org: "my-org",
          repo: "typescript-ai-rules",
          relativeFilePaths: [
            {
              fileName: "exclude-rule.mdc",
              categoryFolderName: "exclude-category",
            },
          ],
        },
      ],
    };

    const centralRules = [
      {
        org: "my-org",
        repo: "typescript-ai-rules",
        relativeFilePaths: [
          {
            fileName: "some-rule.mdc",
            categoryFolderName: "some-rule-category",
          },
        ],
      },
    ];

    const result = removeMissingCentralRulesFromCariYaml(
      selectedRules,
      centralRules
    );

    expect(result.include).toHaveLength(1);
    expect(result.exclude).toHaveLength(0);
  });
});
