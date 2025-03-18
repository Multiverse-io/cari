import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import yaml from "yaml";
import fs from "fs-extra";
import mockFs from "mock-fs";
import path from "path";
import { getAriYaml, SelectedRules, writeRulesToAriYaml } from "./ari-yaml.js";

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

const existingYamlWithExtras = {
  ...existingYaml,
  otherConfig: {
    setting1: "value1",
    setting2: true,
  },
};

const projectDir = "/home/user/my-project";

const ariYamlPath = path.join(projectDir, ".ari.yaml");

beforeEach(() => {
  vi.clearAllMocks();
  mockFs.restore();
  vi.spyOn(process, "cwd").mockReturnValue(projectDir);
});

afterEach(() => {
  mockFs.restore();
});

describe("writeSelectedRulesToProject", () => {
  it("should create the .ari.yaml file in the project if it doesn't exist", async () => {
    mockFs({
      [projectDir]: {},
    });

    await writeRulesToAriYaml(selectedRules);

    expect(fs.existsSync(ariYamlPath)).toBe(true);
    const fileContent = fs.readFileSync(ariYamlPath, "utf8");
    const yamlContent = yaml.parse(fileContent);

    expect(yamlContent).toHaveProperty("rules");
    expect(yamlContent.rules).toHaveProperty("include");
    expect(yamlContent.rules).toHaveProperty("exclude");
    expect(yamlContent.rules.include).toEqual(selectedRules.include);
    expect(yamlContent.rules.exclude).toEqual(selectedRules.exclude);
  });

  it("should only overwrite the rules section of the existing yaml file", async () => {
    mockFs({
      [ariYamlPath]: yaml.stringify(existingYamlWithExtras),
    });
    await writeRulesToAriYaml(selectedRules);
    expect(fs.existsSync(ariYamlPath)).toBe(true);
    const fileContent = fs.readFileSync(ariYamlPath, "utf8");
    const yamlContent = yaml.parse(fileContent);
    expect(yamlContent.rules.include).toEqual(selectedRules.include);
    expect(yamlContent.rules.exclude).toEqual(selectedRules.exclude);
    expect(yamlContent.otherConfig).toEqual(existingYamlWithExtras.otherConfig);
  });
});

describe("getAriYaml", () => {
  it("should return the ari yaml object", async () => {
    mockFs({
      [ariYamlPath]: yaml.stringify(existingYaml),
    });
    const ariYaml = await getAriYaml();
    expect(ariYaml).toEqual(existingYaml);
  });
});
