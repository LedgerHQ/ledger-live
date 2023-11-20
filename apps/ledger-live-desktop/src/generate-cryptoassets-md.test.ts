// it is a bit a hack but it's a test that run in jest
// to access the libs / babel ecosystem and generate a markdown file!
// it passes if the file doesn't change (like a snapshot!)
// to run this test: pnpm desktop test:jest src/generate-cryptoassets-md.test.ts
import { test, expect } from "@jest/globals";
import fs from "fs";
import "./live-common-set-supported-currencies";
import { generateMarkdown, outputFile } from "./generate-cryptoassets-md";

test("generate cryptoassets.md", () => {
  const md = generateMarkdown();
  const existing = fs.readFileSync(outputFile, "utf-8");
  expect(existing).toBe(md);
});
