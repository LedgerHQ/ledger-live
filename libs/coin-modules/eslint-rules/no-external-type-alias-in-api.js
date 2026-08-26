"use strict";

/**
 * Dans le répertoire `api` d'un coin-module, interdit de définir un type alias
 * dont la définition ré-emballe un type IMPORTÉ (donc défini dans un autre
 * répertoire / package). Les types de `api` doivent être écrits explicitement.
 *
 * Une whitelist (`allowedTypes`) permet d'autoriser certains types importés
 * comme racine d'alias (typiquement le type d'API du framework que chaque coin
 * spécialise). Un type whitelisté est autorisé avec OU sans generics, et on
 * n'inspecte pas ses arguments de type.
 *
 * Interdit :
 *   import { Foo } from "../logic";        type B = Foo;           // alias nu
 *   import { Bar } from "@ledgerhq/xxx";   type B = Bar | Baz;     // union de réfs nues
 *   import { Foo } from "../logic";        type B = Partial<Foo>;  // Foo utilisé nu (Partial non whitelisté)
 *   import { Foo } from "../logic";        type B = Foo[];         // Foo utilisé nu
 *   import { Foo } from "../logic";        type B = Foo<string>;   // Foo non whitelisté
 *
 * Autorisé :
 *   type Foo = { ... };  type B = Foo;                     // A local (non importé)
 *   type B = { x: Foo };                                   // vraie forme d'objet, pas un alias nu
 *   type B = "a" | "b";                                    // union littérale, aucune référence importée
 *   type B = string | number;                             // primitifs
 *   type B = Partial<TypeLocal>;                          // wrapper d'un type local
 *   // avec allowedTypes: ["CoinModuleApi"]
 *   type B = CoinModuleApi<X, Y>;                         // type whitelisté (avec ou sans generics)
 */

function rootTypeName(typeName) {
  let node = typeName;
  while (node && node.type === "TSQualifiedName") node = node.left; // A.B -> A
  return node && node.type === "Identifier" ? node.name : null;
}

function typeArgs(t) {
  // Le conteneur d'arguments de type varie selon la version du parser.
  return t.typeArguments || t.typeParameters;
}

// Trouve la 1re référence INTERDITE à un type importé dans les constructions "transparentes".
// N'entre PAS dans les objets ({ x: A }) : ce sont de vraies définitions explicites.
// Retourne { name, source, node } où `node` est la référence exacte à signaler.
//
// allowed: Set de noms de types whitelistés. Une racine whitelistée est autorisée
// (avec ou sans generics) et on ne descend pas dans ses arguments.
function findImportedRef(t, imported, allowed) {
  if (!t) return null;
  switch (t.type) {
    case "TSTypeReference": {
      const name = rootTypeName(t.typeName);
      // Racine whitelistée -> autorisée, on n'inspecte pas ses arguments.
      if (name && allowed.has(name)) return null;
      // Racine importée et non whitelistée -> interdit (nu ou instancié).
      if (name && imported.has(name)) {
        return { name, source: imported.get(name), node: t.typeName };
      }
      // Racine non importée (Partial, Array, un type local...) -> on inspecte les args.
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
      return null; // TSTypeLiteral (objet), fonctions, primitifs... -> autorisés
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
          // Sources à NE PAS considérer comme "ailleurs" (regex testées sur le module importé).
          // Ex. pour tolérer les imports relatifs internes à api : { ignoreSources: ["^\\./"] }
          ignoreSources: { type: "array", items: { type: "string" } },
          // Whitelist de noms de types autorisés comme racine d'alias
          // (ex. ["CoinModuleApi"]). Autorisés avec ou sans generics.
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

    const imported = new Map(); // nom local -> source du module

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
            node: hit.node, // pointe la référence exacte (ex. `Foo` dans `type B = Partial<Foo>`)
            messageId: "noAlias",
            data: { name: hit.name, alias: node.id.name, source: hit.source },
          });
        }
      },
    };
  },
};
