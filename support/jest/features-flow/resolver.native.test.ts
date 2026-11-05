// Jest loads custom resolvers with requireOrImportModule (ESM default export or CJS module.exports).

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("resolver.native.ts loads as a callable default export, like jest's resolver import", async () => {
  const resolverPath = path.join(import.meta.dirname, "resolver.native.ts");
  const loaded = await import(pathToFileURL(resolverPath).href);
  assert.equal(typeof loaded.default, "function");
});
