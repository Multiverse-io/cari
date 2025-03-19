import { describe, it, expect, vi, beforeEach } from "vitest";
import { init } from "./init.js";
import yaml from "yaml";
import fs, { pathExists } from "fs-extra";
import {
  homeDir,
  mockDirs,
  mockEmptyHomeDir,
  projectDir,
} from "../__test__/test-utils.js";

const emptyProjectDir = { [projectDir]: {} };

const populatedAriHomeDir = {
  "/home/user/.cari/my-org/ai-rules/rules": {
    "some-rule-category": {
      "some-rule.mdc": "some-rule-content",
      "another-rule.mdc": "another-rule-content",
    },
  },
};

vi.mock("os", () => ({
  default: {
    homedir: vi.fn().mockImplementation(() => homeDir),
  },
}));

const gitMock = {
  clone: vi.fn().mockResolvedValue(undefined),
};

vi.mock("simple-git", () => ({
  simpleGit: vi.fn(() => gitMock),
}));

const checkboxMock = vi.fn();

const inputMock = vi.fn();
vi.mock("@inquirer/prompts", () => ({
  checkbox: () => checkboxMock(),
  input: () => inputMock(),
}));

const repoUrl = "git@github.com:my-org/ai-rules.git";

beforeEach(() => {
  vi.spyOn(process, "cwd").mockReturnValue(projectDir);
  vi.clearAllMocks();
});

describe("init command", () => {
  it("should create and populate ~/.cari directory if it doesn't exist", async () => {
    mockEmptyHomeDir();
    inputMock.mockResolvedValueOnce(repoUrl);
    inputMock.mockResolvedValueOnce("");
    checkboxMock.mockResolvedValue([
      {
        type: "directory",
        org: "my-org",
        repo: "ai-rules",
        directory: "some-rule-category",
        ruleRelativeFilePaths: [
          {
            categoryFolderName: "some-rule-category",
            fileName: "some-rule.mdc",
          },
        ],
      },
    ]);
    await init();
    expect(pathExists(`${homeDir}/.cari`)).resolves.toBe(true);
    expect(gitMock.clone).toHaveBeenCalledWith(
      repoUrl,
      `${homeDir}/.cari/my-org/ai-rules`
    );
  });

  it("should setup rules and an .cari.yaml file in the current directory based on the user's selection", async () => {
    mockDirs(populatedAriHomeDir, emptyProjectDir);
    inputMock.mockResolvedValueOnce(repoUrl);
    checkboxMock.mockResolvedValue([
      {
        type: "directory",
        org: "my-org",
        repo: "ai-rules",
        directory: "some-rule-category",
        ruleRelativeFilePaths: [
          {
            categoryFolderName: "some-rule-category",
            fileName: "some-rule.mdc",
          },
        ],
      },
    ]);
    await init();
    const expectedRulesDir = `${projectDir}/.cursor/rules`;
    await expect(
      fs.readFile(
        `${expectedRulesDir}/my-org/ai-rules/some-rule-category/some-rule.mdc`,
        "utf8"
      )
    ).resolves.toBe("some-rule-content");

    const expectedAriYamlContent: AriYaml = {
      repos: [
        {
          orgName: "my-org",
          repoName: "ai-rules",
          repoDir: `${homeDir}/.cari/my-org/ai-rules`,
          repoUrl,
        },
      ],
      rules: {
        include: [
          {
            org: "my-org",
            repo: "ai-rules",
            relativeFilePaths: [
              {
                categoryFolderName: "some-rule-category",
                fileName: "some-rule.mdc",
              },
            ],
          },
        ],
        exclude: [
          {
            org: "my-org",
            repo: "ai-rules",
            relativeFilePaths: [
              {
                categoryFolderName: "some-rule-category",
                fileName: "another-rule.mdc",
              },
            ],
          },
        ],
      },
    };
    const actualAriYamlContent = yaml.parse(
      await fs.readFile(`${projectDir}/.cari.yaml`, "utf8")
    );
    expect(actualAriYamlContent).toEqual(expectedAriYamlContent);
  });
});
