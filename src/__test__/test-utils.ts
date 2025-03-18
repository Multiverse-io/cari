import mockFs from "mock-fs";
import { mergeObjects } from "../utils/utils.js";

export const mockDirs = (...dirs: Record<string, any>[]) => {
  mockFs(mergeObjects(...dirs));
};

export const homeDir = "/home/user";
export const projectDir = `${homeDir}/my-project`;
