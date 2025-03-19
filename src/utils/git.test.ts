import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractRepoDetails } from "./git.js";
import mockFs from "mock-fs";
import os from "os";

describe("extractRepoDetails", () => {
  const mockHomeDir = "/home/user";
  const mockAriDir = "/home/user/.cari";
  const mockRepoDir = "/home/user/.cari/my-org/my-repo";

  beforeEach(() => {
    vi.spyOn(os, "homedir").mockReturnValue(mockHomeDir);
    mockFs({
      [mockAriDir]: {},
    });
  });

  afterEach(() => {
    mockFs.restore();
    vi.clearAllMocks();
  });

  it("should correctly extract details from an HTTPS URL", () => {
    const repoUrl = "https://github.com/my-org/my-repo.git";
    const result = extractRepoDetails(repoUrl);

    expect(result).toEqual({
      repoUrl,
      repoDir: mockRepoDir,
      repoName: "my-repo",
      orgName: "my-org",
    });
  });

  it("should correctly extract details from an SSH URL", () => {
    const repoUrl = "git@github.com:my-org/my-repo.git";
    const result = extractRepoDetails(repoUrl);

    expect(result).toEqual({
      repoUrl,
      repoDir: mockRepoDir,
      repoName: "my-repo",
      orgName: "my-org",
    });
  });

  it("should handle URLs without .git extension", () => {
    const repoUrl = "https://github.com/my-org/my-repo";
    const result = extractRepoDetails(repoUrl);

    expect(result).toEqual({
      repoUrl,
      repoDir: mockRepoDir,
      repoName: "my-repo",
      orgName: "my-org",
    });
  });

  it("should handle URLs with different domain names", () => {
    const repoUrl = "https://gitlab.com/my-org/my-repo.git";
    const result = extractRepoDetails(repoUrl);

    expect(result).toEqual({
      repoUrl,
      repoDir: mockRepoDir,
      repoName: "my-repo",
      orgName: "my-org",
    });
  });

  it("should handle URLs with different SSH hostnames", () => {
    const repoUrl = "git@gitlab.com:my-org/my-repo.git";
    const result = extractRepoDetails(repoUrl);

    expect(result).toEqual({
      repoUrl,
      repoDir: mockRepoDir,
      repoName: "my-repo",
      orgName: "my-org",
    });
  });
});
