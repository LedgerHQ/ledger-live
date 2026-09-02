"use strict";

/**
 * In a coin-module's `api` directory, forbids defining a type alias whose
 * definition re-wraps an IMPORTED type (i.e. defined in another directory /
 * package). Types in `api` must be written explicitly.
 *
 * A whitelist (`allowedTypes`) allows certain imported types as an alias root
 * (typically the framework API type that each coin specializes). A whitelisted
 * type is allowed WITH or WITHOUT generics, and its type arguments are not
 * inspected.
 *
 * Forbidden:
 *   import { Foo } from "../logic";        type B = Foo;           // bare alias
 *   import { Bar } from "@ledgerhq/xxx";   type B = Bar | Baz;     // union of bare refs
 *   import { Foo } from "../logic";        type B = Partial<Foo>;  // Foo used bare (Partial not whitelisted)
 *   import { Foo } from "../logic";        type B = Foo[];         // Foo used bare
 *   import { Foo } from "../logic";        type B = Foo<string>;   // Foo not whitelisted
 *
 * Allowed:
 *   type Foo = { ... };  type B = Foo;                     // A is local (not imported)
 *   type B = { x: Foo };                                   // real object shape, not a bare alias
 *   type B = "a" | "b";                                    // literal union, no imported reference
 *   type B = string | number;                             // primitives
 *   type B = Partial<TypeLocal>;                          // wrapper around a local type
 *   // with allowedTypes: ["CoinModuleApi"]
 *   type B = CoinModuleApi<X, Y>;                         // whitelisted type (with or without generics)
 */

function rootTypeName(typeName) {
  let node = typeName;
  while (node && node.type === "TSQualifiedName") node = node.left; // A.B -> A
  return node && node.type === "Identifier" ? node.name : null;
}

function typeArgs(t) {
  // The type-arguments container name varies with the parser version.
  return t.typeArguments || t.typeParameters;
}

// Finds the 1st FORBIDDEN reference to an imported type within "transparent" constructs.
// Does NOT descend into objects ({ x: A }): those are genuine explicit definitions.
// Returns { name, source, node } where `node` is the exact reference to report.
//
// allowed: Set of whitelisted type names. A whitelisted root is allowed
// (with or without generics) and its arguments are not inspected.
function findImportedRef(t, imported, allowed) {
  if (!t) return null;
  switch (t.type) {
    case "TSTypeReference": {
      const name = rootTypeName(t.typeName);
      // Whitelisted root -> allowed, its arguments are not inspected.
      if (name && allowed.has(name)) return null;
      // Imported and non-whitelisted root -> forbidden (bare or instantiated).
      if (name && imported.has(name)) {
        return { name, source: imported.get(name), node: t.typeName };
      }
      // Non-imported root (Partial, Array, a local type...) -> inspect the args.
      for (const p of typeArgs(t)?.params || []) {
        const hit = findImportedRef(p, imported, allowed); // Partial<A>, Array<A>...
        if (hit) return hit;
      }
      return null;
    }
    case "TSUnionType":
    case "TSIntersectionType": {
      for (const sub of t.types) {
        const hit = findImportedRef(sub, imported, allowed); // A | C , A & C
        if (hit) return hit;
      }
      return null;
    }
    case "TSArrayType":
      return findImportedRef(t.elementType, imported, allowed); // A[]
    case "TSParenthesizedType":
    case "TSTypeOperator":
      return findImportedRef(t.typeAnnotation, imported, allowed); // (A) , keyof A , readonly A[]
    default:
      return null; // TSTypeLiteral (object), functions, primitives... -> allowed
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "In api/, forbid aliasing a type imported from elsewhere (type B = A)",
    },
    schema: [
      {
        type: "object",
        properties: {
          // Sources NOT to consider as "elsewhere" (regexes tested on the imported module).
          // E.g. to tolerate relative imports internal to api: { ignoreSources: ["^\\./"] }
          ignoreSources: { type: "array", items: { type: "string" } },
          // Whitelist of type names allowed as an alias root
          // (e.g. ["CoinModuleApi"]). Allowed with or without generics.
          allowedTypes: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noAlias:
        "Dans `api`, interdit d'aliaser `{{name}}` (importé de `{{source}}`, défini ailleurs). Écris le type explicitement, ou ajoute `{{name}}` à `allowedTypes` si c'est un wrapper légitime.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const ignore = (options.ignoreSources || []).map(s => new RegExp(s));
    const isIgnored = src => ignore.some(re => re.test(src));
    const allowed = new Set(options.allowedTypes || []);

    const imported = new Map(); // local name -> module source

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string" || isIgnored(source)) return;
        for (const spec of node.specifiers) {
          // ImportSpecifier + ImportDefaultSpecifier + ImportNamespaceSpecifier
          if (spec.local) imported.set(spec.local.name, source);
        }
      },
      TSTypeAliasDeclaration(node) {
        const hit = findImportedRef(node.typeAnnotation, imported, allowed);
        if (hit) {
          context.report({
            node: hit.node, // points at the exact reference (e.g. `Foo` in `type B = Partial<Foo>`)
            messageId: "noAlias",
            data: { name: hit.name, alias: node.id.name, source: hit.source },
          });
        }
      },
    };
  },
};
