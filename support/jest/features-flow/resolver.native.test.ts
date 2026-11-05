// Jest loads custom resolvers with requireOrImportModule (ESM default export or CJS module.exports).

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import type { NativeResolverOptions } from "./resolver.native.ts";

type Resolver = (request: string, options: NativeResolverOptions) => string;

async function loadResolver(): Promise<Resolver> {
  const resolverPath = path.join(import.meta.dirname, "resolver.native.ts");
  const loaded = await import(pathToFileURL(resolverPath).href);
  assert.equal(typeof loaded.default, "function");
  return loaded.default;
}

function stubDefaultResolver(): {
  defaultResolver: (request: string, options: object) => string;
  captured: { conditions?: string[] };
} {
  const captured: { conditions?: string[] } = {};
  const defaultResolver = (_request: string, options: object) => {
    Object.assign(captured, options);
    return "/resolved";
  };
  return { defaultResolver, captured };
}

test("resolver.native.ts loads as a callable default export, like jest's resolver import", async () => {
  await loadResolver();
});

test("@features/* resolves with react-native condition first", async () => {
  const resolver = await loadResolver();
  const { defaultResolver, captured } = stubDefaultResolver();
  resolver("@features/flow-contacts/foo", { defaultResolver, conditions: ["node"] });
  assert.deepEqual(captured.conditions, ["react-native", "node"]);
});

test("@shared/* resolves with react-native condition first", async () => {
  const resolver = await loadResolver();
  const { defaultResolver, captured } = stubDefaultResolver();
  resolver("@shared/i18n/bar", { defaultResolver, conditions: ["node"] });
  assert.deepEqual(captured.conditions, ["react-native", "node"]);
});

test("packages outside @features and @shared keep conditions unchanged", async () => {
  const resolver = await loadResolver();
  const { defaultResolver, captured } = stubDefaultResolver();
  resolver("@ledgerhq/live-common/baz", { defaultResolver, conditions: ["node"] });
  assert.deepEqual(captured.conditions, ["node"]);
});
