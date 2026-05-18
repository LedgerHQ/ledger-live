#!/usr/bin/env node
/**
 * Generate gql.tada-compatible introspection types from the SUI schema.
 *
 * Fetched introspection is tree-shaken to types/fields
 * referenced by `graphql(\`...\`)` in `src/network`.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { outputIntrospectionFile } from "@gql.tada/internal";
import {
  buildClientSchema,
  parse,
  visit,
  visitWithTypeInfo,
  TypeInfo,
  getNamedType,
  isInputObjectType,
  typeFromAST,
} from "graphql";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PACKAGE_DIR = join(__dirname, "..");
const SOURCES_DIR = join(PACKAGE_DIR, "src/network");
const GRAPHQL_DIR = join(SOURCES_DIR, "graphql");
const INTROSPECTION_PATH = join(GRAPHQL_DIR, "introspection.json");
const OUTPUT_PATH = join(GRAPHQL_DIR, "graphql-env.d.ts");
const INTROSPECTION_QUERY_PATH = join(__dirname, "introspection-query.graphql");
const TADA_PATH = join(GRAPHQL_DIR, "tada.ts");

const DEFAULT_ENDPOINT = "https://graphql.mainnet.sui.io/graphql";
const FETCH_TIMEOUT_MS = 30_000;
const FETCH_RETRIES = 1;
const FETCH_BACKOFF_MS = 1_000;
const REGEN_HINT =
  "Run `pnpm --filter @ledgerhq/coin-sui graphql:codegen:fetch` and commit the result.";

// Parsed in `main()` so importing this file as a library (e.g. tests) doesn't trigger CLI parsing.
let endpoint = DEFAULT_ENDPOINT;

function printUsage() {
  console.log(`Usage: node scripts/generate-graphql-types.mjs [options]

Options:
  --fetch                 Re-fetch the live introspection, prune, and regenerate types.
  --check                 Compare the live (pruned) introspection against the committed snapshot.
                          Exits non-zero on drift. Intended for scheduled CI, not per-PR.
  --endpoint=<url>        GraphQL endpoint (default: ${DEFAULT_ENDPOINT}).
  -h, --help              Show this help.

Default (no flag): regenerate \`graphql-env.d.ts\` from the committed snapshot.`);
}

const INTROSPECTION_QUERY = readFileSync(INTROSPECTION_QUERY_PATH, "utf-8");

/** Mirror of `tada.ts`'s `SuiScalars` — must stay in sync; checked at runtime below. */
const CUSTOM_SCALARS = ["DateTime", "SuiAddress", "BigInt", "UInt53", "Base64", "JSON"];

const BUILTIN_SCALARS = ["Int", "Float", "String", "Boolean", "ID"];

/** Required by `buildClientSchema` even when no user query references them. */
const INTROSPECTION_TYPES = [
  "__Schema",
  "__Type",
  "__Field",
  "__InputValue",
  "__EnumValue",
  "__Directive",
  "__TypeKind",
  "__DirectiveLocation",
];

/** gql.tada doesn't consume these fields, and stripping them keeps `--check` diffs structural. */
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

/** Recursively yield `.ts` paths under `dir`, skipping `node_modules`. */
function* walkTsFiles(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walkTsFiles(full);
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      yield full;
    }
  }
}

/** Function-call form only; the `(` requirement skips markdown `` `graphql` `` in JSDoc. */
function collectQuerySources() {
  const docs = [];
  const re = /\bgraphql\s*\(\s*`([\s\S]*?)`/g;
  for (const file of walkTsFiles(SOURCES_DIR)) {
    const src = readFileSync(file, "utf-8");
    let m;
    while ((m = re.exec(src)) !== null) {
      docs.push(m[1]);
    }
  }
  if (docs.length === 0) {
    throw new Error("[generate-graphql-types] No graphql(`...`) documents found under src/.");
  }
  return docs;
}

/** Read `tada.ts` and extract the field names of `type SuiScalars = { … }`. */
function readTadaScalarKeys() {
  const src = readFileSync(TADA_PATH, "utf-8");
  const block = src.match(/type\s+SuiScalars\s*=\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!block) {
    throw new Error(
      `[generate-graphql-types] Could not locate \`type SuiScalars\` in ${TADA_PATH}.`,
    );
  }
  return [...block.matchAll(/^\s*(\w+)\s*:/gm)].map(m => m[1]);
}

/** Unwrap NON_NULL/LIST wrappers in an introspection `TypeRef`, returning the named type's name. */
function namedTypeRefName(ref) {
  let t = ref;
  while (t && t.ofType) t = t.ofType;
  return t && t.name ? t.name : null;
}

/** Walk `documents` against `schema`; records every directly-referenced type and field. */
function collectReferences(schema, documents) {
  const usedFields = new Map(); // typeName -> Set<fieldName>
  const usedTypes = new Set();

  const addField = (typeName, fieldName) => {
    if (!usedFields.has(typeName)) usedFields.set(typeName, new Set());
    usedFields.get(typeName).add(fieldName);
    usedTypes.add(typeName);
  };

  const parsed = parse(documents.join("\n"));
  const typeInfo = new TypeInfo(schema);
  visit(
    parsed,
    visitWithTypeInfo(typeInfo, {
      Field() {
        const parent = typeInfo.getParentType();
        const field = typeInfo.getFieldDef();
        if (!parent || !field) return;
        addField(parent.name, field.name);
        const ret = getNamedType(field.type);
        if (ret) usedTypes.add(ret.name);
        for (const arg of field.args) {
          const argType = getNamedType(arg.type);
          if (argType) usedTypes.add(argType.name);
        }
      },
      InlineFragment(node) {
        if (node.typeCondition) usedTypes.add(node.typeCondition.name.value);
      },
      VariableDefinition(node) {
        const t = typeFromAST(schema, node.type);
        if (!t) return;
        const named = getNamedType(t);
        if (named) usedTypes.add(named.name);
      },
      ObjectField(node) {
        const parent = typeInfo.getParentInputType();
        if (!parent) return;
        const named = getNamedType(parent);
        if (!isInputObjectType(named)) return;
        addField(named.name, node.name.value);
        const f = named.getFields()[node.name.value];
        if (f) {
          const fieldNamed = getNamedType(f.type);
          if (fieldNamed) usedTypes.add(fieldNamed.name);
        }
      },
    }),
  );

  return { usedTypes, usedFields };
}

/** Add roots, built-in/custom scalars, and introspection meta-types to the keep set. */
function seedAlwaysKeep(usedTypes, root) {
  const seeds = [
    root.__schema.queryType?.name,
    root.__schema.mutationType?.name,
    root.__schema.subscriptionType?.name,
    ...BUILTIN_SCALARS,
    ...CUSTOM_SCALARS,
    ...INTROSPECTION_TYPES,
  ];
  for (const name of seeds) if (name) usedTypes.add(name);
}

/** Surface scalar-list drift as a script-level error rather than a downstream typecheck failure. */
function assertCustomScalarsExist(typesByName) {
  const tadaKeys = readTadaScalarKeys();
  const inScript = new Set(CUSTOM_SCALARS);
  const inTada = new Set(tadaKeys);
  const missingFromScript = tadaKeys.filter(k => !inScript.has(k));
  const missingFromTada = CUSTOM_SCALARS.filter(k => !inTada.has(k));
  if (missingFromScript.length > 0 || missingFromTada.length > 0) {
    throw new Error(
      "[generate-graphql-types] CUSTOM_SCALARS / SuiScalars drift detected.\n" +
        (missingFromScript.length
          ? `  In tada.ts but missing here: ${missingFromScript.join(", ")}\n`
          : "") +
        (missingFromTada.length
          ? `  Here but missing from tada.ts: ${missingFromTada.join(", ")}\n`
          : "") +
        "Update both lists together.",
    );
  }
  for (const name of CUSTOM_SCALARS) {
    if (!typesByName.has(name)) {
      throw new Error(
        `[generate-graphql-types] Custom scalar "${name}" missing from introspection — ` +
          `update CUSTOM_SCALARS in this script and tada.ts together.`,
      );
    }
  }
}

/** BFS-style: pull every type's transitive deps (interfaces, return types, arg/input field types). */
function closeOverDependencies(typesByName, { usedTypes, usedFields }) {
  const queue = [...usedTypes];
  while (queue.length > 0) {
    const typeName = queue.pop();
    const t = typesByName.get(typeName);
    if (!t) continue;

    const tryAdd = name => {
      if (name && !usedTypes.has(name)) {
        usedTypes.add(name);
        queue.push(name);
      }
    };

    if (t.kind === "OBJECT" || t.kind === "INTERFACE") {
      for (const iface of t.interfaces ?? []) tryAdd(namedTypeRefName(iface));
      const usedSet = usedFields.get(typeName);
      if (!usedSet) continue;
      for (const field of t.fields ?? []) {
        if (!usedSet.has(field.name)) continue;
        tryAdd(namedTypeRefName(field.type));
        for (const arg of field.args ?? []) tryAdd(namedTypeRefName(arg.type));
      }
    } else if (t.kind === "INPUT_OBJECT") {
      const usedSet = usedFields.get(typeName);
      if (!usedSet) continue;
      for (const field of t.inputFields ?? []) {
        if (!usedSet.has(field.name)) continue;
        tryAdd(namedTypeRefName(field.type));
      }
    }
    // possibleTypes are filtered (not expanded) below — a type only enters the closure via selection.
  }
}

/** Build the pruned `__schema`: types filtered to closure, fields/inputFields/possibleTypes intersected. */
function filterIntrospection(root, { usedTypes, usedFields }) {
  const keepRef = ref => {
    const n = namedTypeRefName(ref);
    return Boolean(n && usedTypes.has(n));
  };

  const types = root.__schema.types
    .filter(t => usedTypes.has(t.name))
    .map(t => {
      const out = { ...t };
      const usedSet = usedFields.get(t.name);
      if (t.kind === "OBJECT" || t.kind === "INTERFACE") {
        if (Array.isArray(t.fields)) {
          out.fields = usedSet ? t.fields.filter(f => usedSet.has(f.name)) : [];
        }
        if (Array.isArray(t.interfaces)) out.interfaces = t.interfaces.filter(keepRef);
        if (Array.isArray(t.possibleTypes)) out.possibleTypes = t.possibleTypes.filter(keepRef);
      } else if (t.kind === "INPUT_OBJECT") {
        if (Array.isArray(t.inputFields)) {
          out.inputFields = usedSet ? t.inputFields.filter(f => usedSet.has(f.name)) : [];
        }
      } else if (t.kind === "UNION") {
        if (Array.isArray(t.possibleTypes)) out.possibleTypes = t.possibleTypes.filter(keepRef);
      }
      return out;
    });

  return {
    queryType: root.__schema.queryType,
    mutationType: root.__schema.mutationType,
    subscriptionType: root.__schema.subscriptionType,
    types,
    // gql.tada doesn't consume schema-level directives from the introspection.
    directives: [],
  };
}

/** Tree-shake to types/fields referenced by `documents`, plus root types and scalars. */
function pruneIntrospection(json, documents) {
  const root = json.data ?? json;
  const typesByName = new Map(root.__schema.types.map(t => [t.name, t]));
  assertCustomScalarsExist(typesByName);
  const refs = collectReferences(buildClientSchema(root), documents);
  seedAlwaysKeep(refs.usedTypes, root);
  closeOverDependencies(typesByName, refs);
  const prunedSchema = filterIntrospection(root, refs);
  return json.data ? { data: { __schema: prunedSchema } } : { __schema: prunedSchema };
}

/** Single fetch attempt with a hard timeout; throws on HTTP error or GraphQL-level errors. */
async function fetchOnce(query) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Introspection HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`Introspection errors: ${JSON.stringify(json.errors, null, 2)}`);
  return json;
}

/** Wrap `fetchOnce` with one retry on timeouts/transport errors; GraphQL errors propagate immediately. */
async function fetchWithRetry(query) {
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    try {
      return await fetchOnce(query);
    } catch (err) {
      // Only retry transport-level failures; GraphQL `errors[]` are deterministic and won't recover.
      const retriable = err?.name === "TimeoutError" || err?.name === "AbortError" || err?.cause;
      if (attempt === FETCH_RETRIES || !retriable) throw err;
      console.warn(
        `[generate-graphql-types] Fetch attempt ${attempt + 1} failed (${err.message}); retrying…`,
      );
      await new Promise(r => setTimeout(r, FETCH_BACKOFF_MS));
    }
  }
}

/** Shared by `--fetch` and `--check` so both sides apply identical transforms before diffing. */
async function fetchIntrospectionAsString() {
  console.log(`[generate-graphql-types] Fetching introspection from ${endpoint}`);
  const json = await fetchWithRetry(INTROSPECTION_QUERY);
  stripIntrospectionMetadata(json);
  const documents = collectQuerySources();
  const pruned = pruneIntrospection(json, documents);
  return JSON.stringify(pruned, null, 2) + "\n";
}

async function fetchIntrospection() {
  const body = await fetchIntrospectionAsString();
  mkdirSync(GRAPHQL_DIR, { recursive: true });
  writeFileSync(INTROSPECTION_PATH, body);
  console.log(`[generate-graphql-types] Wrote ${INTROSPECTION_PATH} (${body.length} bytes)`);
}

/** Drift only fires when upstream changes affect a type or field actually referenced here. */
async function checkDrift() {
  if (!existsSync(INTROSPECTION_PATH)) {
    console.error(
      `[generate-graphql-types] No snapshot at ${INTROSPECTION_PATH}; run --fetch first.`,
    );
    process.exit(1);
  }
  const live = await fetchIntrospectionAsString();
  const committed = readFileSync(INTROSPECTION_PATH, "utf-8");
  if (live === committed) {
    console.log(
      "[generate-graphql-types] OK: live introspection (pruned) matches the committed snapshot.",
    );
    return;
  }
  // Counts only — operator response is always to re-run :codegen:fetch and review the diff in a PR.
  const liveSize = Buffer.byteLength(live, "utf-8");
  const committedSize = Buffer.byteLength(committed, "utf-8");
  console.error(
    `[generate-graphql-types] DRIFT: live introspection differs from the committed snapshot.\n` +
      `  endpoint:  ${endpoint}\n` +
      `  live size:      ${liveSize} bytes\n` +
      `  committed size: ${committedSize} bytes\n` +
      `  delta:          ${liveSize - committedSize} bytes\n` +
      REGEN_HINT,
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

  // The default `declare module 'gql.tada'` block collides with `@mysten/sui`'s setupSchema.
  const TADA_AUGMENT_IMPORT = "import * as gqlTada from 'gql.tada';";
  const stripStart = ts.indexOf(TADA_AUGMENT_IMPORT);
  if (stripStart !== -1) {
    ts = ts.slice(0, stripStart).trimEnd() + "\n";
  }
  // Sanity: catch a future gql.tada bump that changes the augmentation marker.
  if (ts.includes("declare module 'gql.tada'") || ts.includes(TADA_AUGMENT_IMPORT)) {
    throw new Error(
      "[generate-graphql-types] gql.tada module-augmentation block was not stripped — " +
        "internal output format changed; update the strip marker.",
    );
  }

  // Strip gql.tada's `/* prettier-ignore */` so prettier formats the whole file.
  ts = ts.replace(/^\/\* prettier-ignore \*\/\s*\n?/m, "");
  if (ts.includes("/* prettier-ignore */")) {
    throw new Error(
      "[generate-graphql-types] `/* prettier-ignore */` survived stripping — gql.tada output format changed.",
    );
  }

  const banner = `// This file is auto-generated by scripts/generate-graphql-types.mjs.
// Do not edit by hand. Regenerate with: pnpm graphql:codegen
// Source schema: ${endpoint}
`;

  // Raw write; the `graphql:codegen*` npm scripts run `oxfmt` on the result so the
  // committed file matches save-on-format and stays stable across runs.
  const content = banner + ts;
  writeFileSync(OUTPUT_PATH, content);
  console.log(`[generate-graphql-types] Wrote ${OUTPUT_PATH} (${content.length} bytes)`);
}

function parseCliArgs() {
  const { values } = parseArgs({
    options: {
      fetch: { type: "boolean", default: false },
      check: { type: "boolean", default: false },
      endpoint: { type: "string", default: DEFAULT_ENDPOINT },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
  });
  if (values.help) {
    printUsage();
    process.exit(0);
  }
  if (values.fetch && values.check) {
    console.error("[generate-graphql-types] --fetch and --check are mutually exclusive.");
    process.exit(2);
  }
  return values;
}

async function main() {
  const args = parseCliArgs();
  endpoint = args.endpoint;
  if (args.check) {
    await checkDrift();
    return;
  }
  if (args.fetch) await fetchIntrospection();
  await generateTypes();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
