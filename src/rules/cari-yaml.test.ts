import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import yaml from "yaml";
import fs from "fs-extra";
import mockFs from "mock-fs";
import path from "path";
import {
  getCariYaml,
  writeRulesToCariYaml,
  writeNewCariYamlFile,
} from "./cari-yaml.js";
import { SelectedRules } from "./types.js";

const selectedRules: SelectedRules = {
  include: [
    {
      org: "Multiverse-io",
      repo: "ai-rules",
      relativeFilePaths: [
        {
          fileName: "use-typescript.mdc",
          categoryFolderName: "typescript",
        },
        {
          fileName: "prefer-async-await.mdc",
          categoryFolderName: "javascript",
        },
      ],
    },
  ],
  exclude: [
    {
      org: "Multiverse-io",
      repo: "ai-rules",
      relativeFilePaths: [
        {
          fileName: "avoid-any.mdc",
          categoryFolderName: "typescript",
        },
      ],
    },
  ],
};

const existingYaml = {
  repos: [
    {
      orgName: "OldOrg",
      repoName: "old-repo",
      repoDir: "old-repo",
      repoUrl: "https://github.com/OldOrg/old-repo",
    },
  ],
  rules: {
    include: [
      {
        org: "OldOrg",
        repo: "old-repo",
        relativeFilePaths: [
          {
            fileName: "old-rule.mdc",
            categoryFolderName: "old-category",
          },
        ],
      },
    ],
    exclude: [],
  },
};

const homeDir = vi.hoisted(() => "/home/user");

vi.mock("os", () => ({
  default: {
    homedir: vi.fn().mockImplementation(() => homeDir),
  },
}));

const projectDir = "/home/user/my-project";

const cariYamlPath = path.join(projectDir, ".cari.yaml");

beforeEach(() => {
  vi.clearAllMocks();
  mockFs.restore();
  vi.spyOn(process, "cwd").mockReturnValue(projectDir);
});

afterEach(() => {
  mockFs.restore();
});

describe("writeSelectedRulesToProject", () => {
  it("should create the .cari.yaml file in the project if it doesn't exist", async () => {
    mockFs({
      [projectDir]: {},
    });

    await writeRulesToCariYaml(selectedRules);

    expect(fs.existsSync(cariYamlPath)).toBe(true);
    const fileContent = fs.readFileSync(cariYamlPath, "utf8");
    const yamlContent = yaml.parse(fileContent);

    expect(yamlContent).toHaveProperty("rules");
    expect(yamlContent.rules).toHaveProperty("include");
    expect(yamlContent.rules).toHaveProperty("exclude");
    expect(yamlContent.rules.include).toEqual(selectedRules.include);
    expect(yamlContent.rules.exclude).toEqual(selectedRules.exclude);
  });

  it("should only overwrite the rules section of the existing yaml file", async () => {
    mockFs({
      [cariYamlPath]: yaml.stringify(existingYaml),
    });
    await writeRulesToCariYaml(selectedRules);
    expect(fs.existsSync(cariYamlPath)).toBe(true);
    const fileContent = fs.readFileSync(cariYamlPath, "utf8");
    const yamlContent = yaml.parse(fileContent);
    expect(yamlContent.rules.include).toEqual(selectedRules.include);
    expect(yamlContent.rules.exclude).toEqual(selectedRules.exclude);
    expect(yamlContent.repos).toEqual(existingYaml.repos);
  });
});

describe("getCariYaml", () => {
  it("should return the cari yaml object with absolute paths", async () => {
    mockFs({
      [cariYamlPath]: yaml.stringify(existingYaml),
    });
    const gottenCariYaml = await getCariYaml();
    console.log({ gottenCariYaml });
    expect(gottenCariYaml?.rules).toEqual(existingYaml.rules);
    expect(gottenCariYaml?.repos.length).toEqual(1);
    const gottenRepo = gottenCariYaml?.repos[0];
    const repoInYaml = existingYaml.repos[0];
    expect(gottenRepo?.repoDir).toEqual(path.join(homeDir, "old-repo"));
    expect(gottenRepo?.repoUrl).toEqual(repoInYaml.repoUrl);
    expect(gottenRepo?.orgName).toEqual(repoInYaml.orgName);
    expect(gottenRepo?.repoName).toEqual(repoInYaml.repoName);
  });
});

describe("writeNewCariYamlFile", () => {
  it("should create a new .cari.yaml file with absolute paths converted to relative", async () => {
    mockFs({
      [projectDir]: {},
    });

    const cariYaml = {
      repos: [
        {
          orgName: "TestOrg",
          repoName: "test-repo",
          repoDir: path.join(homeDir, "test-repo"),
          repoUrl: "https://github.com/TestOrg/test-repo",
        },
      ],
      rules: {
        include: [],
        exclude: [],
      },
    };

    await writeNewCariYamlFile(cariYaml);

    expect(fs.existsSync(cariYamlPath)).toBe(true);
    const fileContent = fs.readFileSync(cariYamlPath, "utf8");
    const yamlContent = yaml.parse(fileContent);

    expect(yamlContent.repos[0]).toEqual({
      ...cariYaml.repos[0],
      repoDir: "test-repo", // Should be relative to home directory
    });
    expect(yamlContent.rules).toEqual(cariYaml.rules);
  });
});
