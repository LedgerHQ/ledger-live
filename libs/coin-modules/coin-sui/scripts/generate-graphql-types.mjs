#!/usr/bin/env node
/**
 * Generate gql.tada-compatible introspection types from the SUI schema.
 *
 * Modes:
 *  `--fetch` re-pulls the live schema, default reads the committed snapshot
 *  `--check` diffs live introspection versus local snapshot
 *
 * Fetched introspection is tree-shaken to types/fields
 * referenced by `graphql(\`...\`)` documents under `src/`.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
import { format, resolveConfig } from "prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PACKAGE_DIR = join(__dirname, "..");
const SRC_DIR = join(PACKAGE_DIR, "src");
const GRAPHQL_DIR = join(SRC_DIR, "network", "graphql");
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
  for (const file of walkTsFiles(SRC_DIR)) {
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

/** Unwrap NON_NULL/LIST wrappers in an introspection `TypeRef`, returning the named type's name. */
function namedTypeRefName(ref) {
  let t = ref;
  while (t && t.ofType) t = t.ofType;
  return t && t.name ? t.name : null;
}

/** Tree-shake to types/fields referenced by `documents`, plus root types and scalars. */
function pruneIntrospection(json, documents) {
  const root = json.data ?? json;
  const schema = buildClientSchema(root);

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

  const queryTypeName = root.__schema.queryType?.name;
  const mutationTypeName = root.__schema.mutationType?.name;
  const subscriptionTypeName = root.__schema.subscriptionType?.name;
  const alwaysKeep = [
    queryTypeName,
    mutationTypeName,
    subscriptionTypeName,
    ...BUILTIN_SCALARS,
    ...CUSTOM_SCALARS,
    ...INTROSPECTION_TYPES,
  ].filter(Boolean);
  for (const name of alwaysKeep) usedTypes.add(name);

  const typesByName = new Map(root.__schema.types.map(t => [t.name, t]));

  // Validate scalars exist before we start — typo or schema rename surfaces immediately.
  for (const name of CUSTOM_SCALARS) {
    if (!typesByName.has(name)) {
      throw new Error(
        `[generate-graphql-types] Custom scalar "${name}" missing from introspection — ` +
          `update CUSTOM_SCALARS in this script and tada.ts together.`,
      );
    }
  }

  // Closure: keep adding dependencies until the set stops growing.
  let changed = true;
  while (changed) {
    changed = false;
    for (const typeName of [...usedTypes]) {
      const t = typesByName.get(typeName);
      if (!t) continue;
      if (t.kind === "OBJECT" || t.kind === "INTERFACE") {
        for (const iface of t.interfaces ?? []) {
          const ifaceName = namedTypeRefName(iface);
          if (ifaceName && !usedTypes.has(ifaceName)) {
            usedTypes.add(ifaceName);
            changed = true;
          }
        }
        const usedSet = usedFields.get(typeName);
        if (!usedSet) continue;
        for (const field of t.fields ?? []) {
          if (!usedSet.has(field.name)) continue;
          const ret = namedTypeRefName(field.type);
          if (ret && !usedTypes.has(ret)) {
            usedTypes.add(ret);
            changed = true;
          }
          for (const arg of field.args ?? []) {
            const argType = namedTypeRefName(arg.type);
            if (argType && !usedTypes.has(argType)) {
              usedTypes.add(argType);
              changed = true;
            }
          }
        }
      } else if (t.kind === "INPUT_OBJECT") {
        const usedSet = usedFields.get(typeName);
        if (!usedSet) continue;
        for (const field of t.inputFields ?? []) {
          if (!usedSet.has(field.name)) continue;
          const ft = namedTypeRefName(field.type);
          if (ft && !usedTypes.has(ft)) {
            usedTypes.add(ft);
            changed = true;
          }
        }
      }
      // possibleTypes are filtered (not expanded) below — a type only enters the closure via selection.
    }
  }

  const prunedTypes = root.__schema.types
    .filter(t => usedTypes.has(t.name))
    .map(t => {
      const out = { ...t };
      if (t.kind === "OBJECT" || t.kind === "INTERFACE") {
        const usedSet = usedFields.get(t.name);
        if (Array.isArray(t.fields)) {
          out.fields = usedSet ? t.fields.filter(f => usedSet.has(f.name)) : [];
        }
        if (Array.isArray(t.interfaces)) {
          out.interfaces = t.interfaces.filter(i => {
            const n = namedTypeRefName(i);
            return n && usedTypes.has(n);
          });
        }
        if (Array.isArray(t.possibleTypes)) {
          out.possibleTypes = t.possibleTypes.filter(p => {
            const n = namedTypeRefName(p);
            return n && usedTypes.has(n);
          });
        }
      } else if (t.kind === "INPUT_OBJECT") {
        const usedSet = usedFields.get(t.name);
        if (Array.isArray(t.inputFields)) {
          out.inputFields = usedSet ? t.inputFields.filter(f => usedSet.has(f.name)) : [];
        }
      } else if (t.kind === "UNION") {
        if (Array.isArray(t.possibleTypes)) {
          out.possibleTypes = t.possibleTypes.filter(p => {
            const n = namedTypeRefName(p);
            return n && usedTypes.has(n);
          });
        }
      }
      return out;
    });

  const prunedSchema = {
    queryType: root.__schema.queryType,
    mutationType: root.__schema.mutationType,
    subscriptionType: root.__schema.subscriptionType,
    types: prunedTypes,
    // gql.tada doesn't consume schema-level directives from the introspection.
    directives: [],
  };

  return json.data ? { data: { __schema: prunedSchema } } : { __schema: prunedSchema };
}

/** Shared by `--fetch` and `--check` so both sides apply identical transforms before diffing. */
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
  const [live, committed] = await Promise.all([
    fetchIntrospectionAsString(),
    Promise.resolve(readFileSync(INTROSPECTION_PATH, "utf-8")),
  ]);
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

  // The default `declare module 'gql.tada'` block collides with `@mysten/sui`'s setupSchema.
  const stripStart = ts.indexOf("import * as gqlTada from 'gql.tada';");
  if (stripStart !== -1) {
    ts = ts.slice(0, stripStart).trimEnd() + "\n";
  }

  // Strip gql.tada's `/* prettier-ignore */` so prettier formats the whole file.
  ts = ts.replace(/^\/\* prettier-ignore \*\/\s*\n?/m, "");

  const banner = `// This file is auto-generated by scripts/generate-graphql-types.mjs.
// Do not edit by hand. Regenerate with: pnpm graphql:codegen
// Source schema: ${endpoint}
`;

  // Match the committed file to `prettier --write` output so save-on-format never mutates it.
  const prettierConfig = (await resolveConfig(OUTPUT_PATH)) ?? {};
  const formatted = await format(banner + ts, {
    ...prettierConfig,
    parser: "typescript",
  });

  writeFileSync(OUTPUT_PATH, formatted);
  console.log(`[generate-graphql-types] Wrote ${OUTPUT_PATH} (${formatted.length} bytes)`);
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
