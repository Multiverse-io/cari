import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import yaml from "yaml";
import fs from "fs-extra";
import mockFs from "mock-fs";
import path from "path";
import {
  getCariYaml,
  SelectedRules,
  writeRulesToCariYaml,
} from "./cari-yaml.js";

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
      repoDir: "/home/user/old-repo",
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
  it("should return the cari yaml object", async () => {
    mockFs({
      [cariYamlPath]: yaml.stringify(existingYaml),
    });
    const cariYaml = await getCariYaml();
    expect(cariYaml).toEqual(existingYaml);
  });
});
