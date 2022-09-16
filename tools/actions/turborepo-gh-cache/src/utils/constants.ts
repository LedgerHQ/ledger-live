import * as path from "path";

export const rootDirectory = process.env.GITHUB_WORKSPACE;
export const cacheDirectory = "node_modules/.cache/turbo";
export const absoluteCacheDirectory = path.resolve(
  rootDirectory,
  cacheDirectory
);
export const logFileName = "__turbo_server.log";
export const portFileName = "__turbo_port.txt";
