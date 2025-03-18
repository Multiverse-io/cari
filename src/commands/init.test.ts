import { describe, it, expect, vi, beforeEach } from "vitest";
import { init } from "./init.js";
import yaml from "yaml";
import fs, { pathExists } from "fs-extra";
import { AriYaml } from "../utils/ari-yaml.js";
import {
  homeDir,
  mockDirs,
  mockEmptyHomeDir,
  projectDir,
} from "../__test__/test-utils.js";

const emptyProjectDir = { [projectDir]: {} };

const populatedAriHomeDir = {
  "/home/user/.ari/my-org/ai-rules/rules": {
    "some-rule-category": {
      "some-rule.mdc": "some-rule-content",
      "another-rule.mdc": "another-rule-content",
    },
  },
};

vi.mock("os", () => ({
  default: {
    homedir: vi.fn().mockReturnValue("/home/user"),
  },
}));

const gitMock = {
  cwd: vi.fn().mockReturnThis(),
  raw: vi.fn().mockResolvedValue(undefined),
  clone: vi.fn().mockResolvedValue(undefined),
  pull: vi.fn().mockResolvedValue(undefined),
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
  it("should create and populate ~/.ari directory if it doesn't exist", async () => {
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
    expect(pathExists(`${homeDir}/.ari`)).resolves.toBe(true);
    expect(gitMock.clone).toHaveBeenCalledWith(
      repoUrl,
      `${homeDir}/.ari/my-org/ai-rules`
    );
  });

  it("should setup rules and an .ari.yaml file in the current directory based on the user's selection", async () => {
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
      await fs.readFile(`${projectDir}/.ari.yaml`, "utf8")
    );
    expect(actualAriYamlContent).toEqual(expectedAriYamlContent);
  });
});
