import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import mockFs from "mock-fs";
import fs from "fs-extra";
import yaml from "yaml";
import { homeDir, projectDir } from "../__test__/test-utils.js";
import { CariYaml } from "../rules/cari-yaml.js";
import { update } from "./update.js";
import os from "os";
import { errorMessage, warningMessage } from "../utils/user-message.js";

vi.mock("~/utils/user-message.js", () => ({
  errorMessage: vi.fn(),
  warningMessage: vi.fn(),
  happyMessage: vi.fn(),
}));

const gitMock = {
  pull: vi.fn().mockResolvedValue(undefined),
};

vi.mock("simple-git", () => ({
  simpleGit: vi.fn(() => gitMock),
}));

const checkboxMock = vi.fn();

vi.mock("@inquirer/prompts", () => ({
  checkbox: () => checkboxMock(),
}));

beforeEach(() => {
  vi.spyOn(process, "cwd").mockReturnValue(projectDir);
  vi.spyOn(os, "homedir").mockReturnValue(homeDir);
});

afterEach(() => {
  vi.clearAllMocks();
  mockFs.restore();
});

describe("update command", () => {
  it("should update existing rules", async () => {
    const cariYamlObj: CariYaml = {
      repos: [
        {
          orgName: "my-org",
          repoName: "my-rules-repo",
          repoDir: `${homeDir}/.cari/my-org/my-rules-repo`,
          repoUrl: "https://github.com/my-org/my-rules-repo",
        },
      ],
      rules: {
        include: [
          {
            org: "my-org",
            repo: "my-rules-repo",
            relativeFilePaths: [
              {
                fileName: "some-rule.mdc",
                categoryFolderName: "category",
              },
            ],
          },
        ],
        exclude: [],
      },
    };
    const cariYaml = yaml.stringify(cariYamlObj);
    mockFs({
      // New rule content in the central rules repo
      [`${homeDir}/.cari/my-org/my-rules-repo/rules/category/some-rule.mdc`]:
        "New rule content!",
      // Config file for the project
      [`${projectDir}/.cari.yaml`]: cariYaml,
      // Old rule content in the project which we expect to get overridded with the new rule content
      [`${projectDir}/.cursor/rules/my-org/my-rules-repo/category/some-rule.mdc`]:
        "Old rule content",
    });
    await update();
    expect(gitMock.pull).toHaveBeenCalled();
    expect(
      fs.readFileSync(
        `${projectDir}/.cursor/rules/my-org/my-rules-repo/category/some-rule.mdc`,
        "utf8"
      )
    ).toBe("New rule content!");
  });

  it("should give an error if the .cari.yaml file is not found", async () => {
    mockFs({
      [projectDir]: {},
    });
    await expect(update()).resolves.toBeUndefined();
    expect(errorMessage).toHaveBeenCalledWith(
      ".cari.yaml configuration file not found in the current directory. Please check that you're in the correct directory and run 'cari init' if needed."
    );
  });

  it("should give an error if the .cari.yaml file is not valid", async () => {
    mockFs({
      [`${projectDir}/.cari.yaml`]: "not-valid-yaml",
    });
    await update();
    await expect(update()).resolves.toBeUndefined();
    expect(errorMessage).toHaveBeenCalledWith(
      "Failed to parse existing .cari.yaml file. Please remove the file and run 'cari init' to re-initialize the project."
    );
  });

  it("should ask the user if they want to add new central rules", async () => {
    // Initial state: only existing-rule.mdc is in the project
    const cariYamlObj: CariYaml = {
      repos: [
        {
          orgName: "my-org",
          repoName: "my-rules-repo",
          repoDir: `${homeDir}/.cari/my-org/my-rules-repo`,
          repoUrl: "https://github.com/my-org/my-rules-repo",
        },
      ],
      rules: {
        include: [
          {
            org: "my-org",
            repo: "my-rules-repo",
            relativeFilePaths: [
              {
                fileName: "existing-rule.mdc",
                categoryFolderName: "category",
              },
            ],
          },
        ],
        exclude: [],
      },
    };
    const cariYaml = yaml.stringify(cariYamlObj);

    // Mock filesystem: central repo has both existing and new rule
    mockFs({
      [`${homeDir}/.cari/my-org/my-rules-repo/rules/category/existing-rule.mdc`]:
        "Existing rule content",
      [`${homeDir}/.cari/my-org/my-rules-repo/rules/category/new-rule.mdc`]:
        "New rule content",
      [`${homeDir}/.cari/my-org/my-rules-repo/rules/category/new-rule-we-wont-choose.mdc`]:
        "Rule we won't choose",
      [`${projectDir}/.cari.yaml`]: cariYaml,
      [`${projectDir}/.cursor/rules/my-org/my-rules-repo/category/existing-rule.mdc`]:
        "Existing rule content",
    });

    // Mock user selecting the new rule to add
    checkboxMock.mockResolvedValue([
      {
        type: "file",
        org: "my-org",
        repo: "my-rules-repo",
        ruleRelativeFilePaths: [
          {
            fileName: "new-rule.mdc",
            categoryFolderName: "category",
          },
        ],
      },
    ]);

    await update();

    expect(
      fs.readFileSync(
        `${projectDir}/.cursor/rules/my-org/my-rules-repo/category/new-rule.mdc`,
        "utf8"
      )
    ).toBe("New rule content");

    // Verify .cari.yaml was updated to include both the existing and new rule
    const updatedCariYaml = yaml.parse(
      fs.readFileSync(`${projectDir}/.cari.yaml`, "utf8")
    ) as CariYaml;
    const expectedIncludeRules = [
      {
        org: "my-org",
        repo: "my-rules-repo",
        relativeFilePaths: [
          {
            fileName: "existing-rule.mdc",
            categoryFolderName: "category",
          },
          {
            fileName: "new-rule.mdc",
            categoryFolderName: "category",
          },
        ],
      },
    ];
    const expectedExcludedRules = [
      {
        org: "my-org",
        repo: "my-rules-repo",
        relativeFilePaths: [
          {
            fileName: "new-rule-we-wont-choose.mdc",
            categoryFolderName: "category",
          },
        ],
      },
    ];
    expect(updatedCariYaml.rules.include).toEqual(expectedIncludeRules);
    expect(updatedCariYaml.rules.exclude).toEqual(expectedExcludedRules);
  });

  it("should warn the user if there are rules in their .cari.yaml that are not in the central repo", async () => {
    const cariYamlObj: CariYaml = {
      repos: [
        {
          orgName: "my-org",
          repoName: "my-rules-repo",
          repoDir: `${homeDir}/.cari/my-org/my-rules-repo`,
          repoUrl: "https://github.com/my-org/my-rules-repo",
        },
      ],
      rules: {
        include: [
          {
            org: "my-org",
            repo: "my-rules-repo",
            relativeFilePaths: [
              {
                fileName: "existing-rule.mdc",
                categoryFolderName: "category",
              },
              {
                fileName: "missing-rule.mdc",
                categoryFolderName: "category",
              },
            ],
          },
        ],
        exclude: [],
      },
    };
    const cariYaml = yaml.stringify(cariYamlObj);

    // Mock filesystem: central repo only has existing-rule.mdc
    mockFs({
      [`${homeDir}/.cari/my-org/my-rules-repo/rules/category/existing-rule.mdc`]:
        "Existing rule content",
      [`${projectDir}/.cari.yaml`]: cariYaml,
      [`${projectDir}/.cursor/rules/my-org/my-rules-repo/category/existing-rule.mdc`]:
        "Existing rule content",
      [`${projectDir}/.cursor/rules/my-org/my-rules-repo/category/missing-rule.mdc`]:
        "Content of a rule that no longer exists in central repo",
    });

    await update();

    // Verify warning message about missing rule and its removal from .cari.yaml
    expect(warningMessage).toHaveBeenCalledWith(
      "The following rules in your configuration are not found in the central repository and will be removed from .cari.yaml, but the rule files will remain in your project: category/missing-rule.mdc"
    );

    // Verify the rule was removed from .cari.yaml
    const updatedCariYaml = yaml.parse(
      fs.readFileSync(`${projectDir}/.cari.yaml`, "utf8")
    ) as CariYaml;
    const expectedIncludeRules = [
      {
        org: "my-org",
        repo: "my-rules-repo",
        relativeFilePaths: [
          {
            fileName: "existing-rule.mdc",
            categoryFolderName: "category",
          },
        ],
      },
    ];
    expect(updatedCariYaml.rules.include).toEqual(expectedIncludeRules);

    // Verify the rule file still exists in the project
    expect(
      fs.existsSync(
        `${projectDir}/.cursor/rules/my-org/my-rules-repo/category/missing-rule.mdc`
      )
    ).toBe(true);
    expect(
      fs.readFileSync(
        `${projectDir}/.cursor/rules/my-org/my-rules-repo/category/missing-rule.mdc`,
        "utf8"
      )
    ).toBe("Content of a rule that no longer exists in central repo");
  });
});
