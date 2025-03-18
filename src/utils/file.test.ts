import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import os from "os";
import fs from "fs-extra";
import {
  getHomeDir,
  getAriDir,
  directoryExists,
  ensureDirectoryExists,
} from "./file.js";

// Mock fs-extra and os
vi.mock("fs-extra");
vi.mock("os");

describe("File Utilities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.homedir).mockReturnValue("/home/user");
  });

  describe("getHomeDir", () => {
    it("should return the user home directory", () => {
      expect(getHomeDir()).toBe("/home/user");
      expect(os.homedir).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAriDir", () => {
    it("should return the ARI directory path", () => {
      expect(getAriDir()).toBe("/home/user/.ari");
    });
  });

  describe("directoryExists", () => {
    it("should return true if directory exists", async () => {
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as any);

      const result = await directoryExists("/some/dir");

      expect(result).toBe(true);
      expect(fs.stat).toHaveBeenCalledWith("/some/dir");
    });

    it("should return false if directory does not exist", async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error("Directory not found"));

      const result = await directoryExists("/some/dir");

      expect(result).toBe(false);
      expect(fs.stat).toHaveBeenCalledWith("/some/dir");
    });
  });

  describe("ensureDirectoryExists", () => {
    it("should create directory if it does not exist", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);

      await ensureDirectoryExists("/some/dir");

      expect(fs.ensureDir).toHaveBeenCalledWith("/some/dir");
    });
  });
});
