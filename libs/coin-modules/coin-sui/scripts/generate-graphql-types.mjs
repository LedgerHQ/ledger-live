#!/usr/bin/env node
/**
 * Generate gql.tada-compatible introspection types from the SUI schema.
 * Pipeline: optionally re-fetch the live introspection (`--fetch`) or
 * read the bundled snapshot, then convert it into a `.d.ts` typed
 * introspection via @gql.tada/internal. The snapshot is committed so
 * builds stay hermetic. `--check` diffs live vs. snapshot and exits
 * non-zero on drift — meant for a scheduled CI job, not per-PR.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { outputIntrospectionFile } from "@gql.tada/internal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GRAPHQL_DIR = join(__dirname, "..", "src", "network", "graphql");
const INTROSPECTION_PATH = join(GRAPHQL_DIR, "introspection.json");
const OUTPUT_PATH = join(GRAPHQL_DIR, "graphql-env.d.ts");

const shouldFetch = process.argv.some(a => a === "--fetch");
const shouldCheck = process.argv.some(a => a === "--check");
const endpointArg = process.argv.find(a => a.startsWith("--endpoint="));
const endpoint = endpointArg ? endpointArg.split("=")[1] : "https://graphql.mainnet.sui.io/graphql";

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types { ...FullType }
      directives { name description locations args { ...InputValue } }
    }
  }
  fragment FullType on __Type {
    kind name description
    fields(includeDeprecated: true) {
      name description
      args { ...InputValue }
      type { ...TypeRef }
      isDeprecated deprecationReason
    }
    inputFields { ...InputValue }
    interfaces { ...TypeRef }
    enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason }
    possibleTypes { ...TypeRef }
  }
  fragment InputValue on __InputValue { name description type { ...TypeRef } defaultValue }
  fragment TypeRef on __Type {
    kind name
    ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } }
  }
`;

/**
 * Strip `description` and `deprecationReason` from the introspection
 * (in place). gql.tada doesn't consume them, and dropping them halves
 * snapshot size (~330 KB → ~150 KB) while keeping `--check` apples-to-
 * apples against the live response (which is stripped the same way).
 */
function stripIntrospectionMetadata(node) {
  if (Array.isArray(node)) {
    for (const x of node) stripIntrospectionMetadata(x);
    return;
  }
  if (node !== null && typeof node === "object") {
    delete node.description;
    delete node.deprecationReason;
    for (const k of Object.keys(node)) stripIntrospectionMetadata(node[k]);
  }
}

/**
 * Fetch live introspection as the canonical pretty-printed JSON we
 * write to `introspection.json`. Shared between `--fetch` (persists)
 * and `--check` (diffs). Descriptions are stripped so drift diffs
 * surface only structural changes.
 */
async function fetchIntrospectionAsString() {
  console.log(`[generate-graphql-types] Fetching introspection from ${endpoint}`);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: INTROSPECTION_QUERY }),
  });
  if (!res.ok) {
    throw new Error(`Introspection HTTP ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`Introspection errors: ${JSON.stringify(json.errors, null, 2)}`);
  }
  stripIntrospectionMetadata(json);
  return JSON.stringify(json, null, 2) + "\n";
}

async function fetchIntrospection() {
  const body = await fetchIntrospectionAsString();
  mkdirSync(GRAPHQL_DIR, { recursive: true });
  writeFileSync(INTROSPECTION_PATH, body);
  console.log(`[generate-graphql-types] Wrote ${INTROSPECTION_PATH}`);
}

/**
 * Compare live introspection vs. the committed snapshot; non-zero exit
 * on drift. Meant for a scheduled CI job — failure is driven by
 * upstream Mysten changes, not contributor diffs, so it must not block
 * per-PR runs.
 */
async function checkDrift() {
  if (!existsSync(INTROSPECTION_PATH)) {
    console.error(
      `[generate-graphql-types] No snapshot at ${INTROSPECTION_PATH}; run --fetch first.`,
    );
    process.exit(1);
  }
  const [live, committed] = await Promise.all([
    fetchIntrospectionAsString(),
    Promise.resolve(readFileSync(INTROSPECTION_PATH, "utf-8")),
  ]);
  if (live === committed) {
    console.log(
      "[generate-graphql-types] OK: live introspection matches the committed snapshot.",
    );
    return;
  }
  // Counts only, no full diff — operator response is always the same:
  // re-run :codegen:fetch and review the diff in a PR.
  const liveSize = Buffer.byteLength(live, "utf-8");
  const committedSize = Buffer.byteLength(committed, "utf-8");
  console.error(
    `[generate-graphql-types] DRIFT: live introspection differs from the committed snapshot.\n` +
      `  endpoint:  ${endpoint}\n` +
      `  live size:      ${liveSize} bytes\n` +
      `  committed size: ${committedSize} bytes\n` +
      `  delta:          ${liveSize - committedSize} bytes\n` +
      `Run \`pnpm --filter @ledgerhq/coin-sui graphql:codegen:fetch\` and commit the result.`,
  );
  process.exit(1);
}

async function generateTypes() {
  const json = JSON.parse(readFileSync(INTROSPECTION_PATH, "utf-8"));
  const introspection = json.data ?? json; // accept both wrapped and unwrapped

  let ts = outputIntrospectionFile(introspection, {
    fileType: ".d.ts",
    shouldPreprocess: true,
  });

  // The default output appends a `declare module 'gql.tada'` block that
  // collides with `@mysten/sui`'s own setupSchema declaration merging.
  // Strip it — we use explicit `initGraphQLTada<{ ... }>()` instead.
  const stripStart = ts.indexOf("import * as gqlTada from 'gql.tada';");
  if (stripStart !== -1) {
    ts = ts.slice(0, stripStart).trimEnd() + "\n";
  }

  const banner = `// This file is auto-generated by scripts/generate-graphql-types.mjs.
// Do not edit by hand. Regenerate with: pnpm graphql:codegen
// Source schema: ${endpoint}
`;
  writeFileSync(OUTPUT_PATH, banner + ts);
  console.log(`[generate-graphql-types] Wrote ${OUTPUT_PATH} (${ts.length} bytes)`);
}

async function main() {
  if (shouldCheck) {
    await checkDrift();
    return;
  }
  if (shouldFetch) await fetchIntrospection();
  await generateTypes();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
