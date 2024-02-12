import fs from "fs";
import path from "path";
import { describe, test, expect } from "@jest/globals";

function parsePackageJson(lib: string) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../node_modules", lib, "package.json"), "utf-8"),
  );
}

describe("sentry dependencies", () => {
  const electronPkg = parsePackageJson("@sentry/electron");
  const nodeVersion = electronPkg.dependencies["@sentry/node"];
  test("sentry/node is in sync with sentry/electron", () => {
    expect(parsePackageJson("@sentry/node").version).toBe(nodeVersion);
  });
  test("sentry/tracing is in sync with sentry/electron", () => {
    expect(parsePackageJson("@sentry/tracing").version).toBe(nodeVersion);
  });
});
