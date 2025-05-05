import { describe, it, expect, vi, beforeEach } from "vitest";
import { init } from "./init.js";
import { CariYaml } from "../rules/types.js";
import yaml from "yaml";
import { getCentralRules } from "../rules/rules.js";
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
  clone: vi.fn().mockImplementation(() => {
    mockDirs(populatedAriHomeDir, emptyProjectDir);
    return Promise.resolve(undefined);
  }),
};

vi.mock("simple-git", () => ({
  simpleGit: vi.fn(() => gitMock),
}));

const checkboxMock = vi.fn();
const inputMock = vi.fn();
const warningMessageMock = vi.hoisted(() => vi.fn());
const errorMessageMock = vi.hoisted(() => vi.fn());
const happyMessageMock = vi.hoisted(() => vi.fn());

vi.mock("@inquirer/prompts", () => ({
  checkbox: () => checkboxMock(),
  input: () => inputMock(),
}));

vi.mock("../utils/user-message.js", () => ({
  warningMessage: warningMessageMock,
  errorMessage: errorMessageMock,
  happyMessage: happyMessageMock,
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
    await expect(pathExists(`${homeDir}/.cari`)).resolves.toBe(true);
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

    const expectedAriYamlContent: CariYaml = {
      repos: [
        {
          orgName: "my-org",
          repoName: "ai-rules",
          repoDir: `.cari/my-org/ai-rules`,
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

  it("should log a warning to the user if they didn't select any rules to include", async () => {
    mockDirs(populatedAriHomeDir, emptyProjectDir);
    inputMock.mockResolvedValueOnce(repoUrl);
    // First time the user selects no rules
    checkboxMock.mockResolvedValueOnce([]);
    // They are asked to select again and second time the user selects at least one rule
    checkboxMock.mockResolvedValueOnce([
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
    expect(warningMessageMock).toHaveBeenCalledWith(
      "No rules were selected to include. Please select at least one rule to include with <space> or press Ctrl-c to exit."
    );
  });

  it("should exit with an error when no repositories are provided", async () => {
    mockDirs(populatedAriHomeDir, emptyProjectDir);

    // Mock empty input to simulate no repos being added
    inputMock.mockResolvedValueOnce("");

    // Suppress console.error messages because this test will throw an (expected) error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });

    // Expect the init function to throw the error from our mocked process.exit
    await expect(init()).rejects.toThrow("Process exited with code 1");

    expect(errorMessageMock).toHaveBeenCalledWith(
      "No repositories were added. Please try again and enter at least one repository URL."
    );
  });
});
