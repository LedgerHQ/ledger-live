"use strict";

/**
 * In a coin-module's `api` directory, the types used in the SIGNATURES of the
 * `CoinModuleApi` implementation functions (the object returned by `createApi()`)
 * must be defined in the `api/types.ts` file.
 *
 * Allowed:
 *   - types imported from `api/types.ts` (relative import `./types`);
 *   - types imported from the framework (`frameworkSources` option).
 *
 * Reported: any type imported from ELSEWHERE (e.g. `../config`, `../types` at
 * the coin root, another package) and used in a method signature.
 *
 * Locally declared types (not imported) and generic parameters are not reported
 * (they cannot be told apart from globals without type information).
 *
 * The implementation object is recognized as an ObjectExpression whose type
 * (function return, variable annotation, `as`) references `CoinModuleApi` or a
 * local alias of `CoinModuleApi<...>`.
 */

function rootTypeName(typeName) {
  let node = typeName;
  while (node && node.type === "TSQualifiedName") node = node.left; // A.B -> A
  return node && node.type === "Identifier" ? node.name : null;
}

function typeArgs(t) {
  return t.typeArguments || t.typeParameters; // depends on the parser version
}

// Unwraps a TSTypeAnnotation (`: T`) to get the type `T`.
function unwrapAnnotation(ann) {
  return ann && ann.type === "TSTypeAnnotation" ? ann.typeAnnotation : ann;
}

// "Display" name of the API interface recognized in a container type.
function apiDisplayName(t, apiNames) {
  if (!t) return "CoinModuleApi";
  if (t.type === "TSTypeReference") {
    const name = rootTypeName(t.typeName);
    if (name && apiNames.has(name)) return name;
  }
  if (t.type === "TSIntersectionType" || t.type === "TSUnionType") {
    for (const sub of t.types) {
      const name = apiDisplayName(sub, apiNames);
      if (name !== "CoinModuleApi" || referencesApiType(sub, apiNames)) return name;
    }
  }
  return "CoinModuleApi";
}

// A type "recognized as API": references CoinModuleApi (or a local alias),
// possibly inside an intersection (`CoinModuleApi<...> & {...}`).
function referencesApiType(t, apiNames) {
  if (!t) return false;
  if (t.type === "TSTypeReference") {
    const name = rootTypeName(t.typeName);
    return !!name && apiNames.has(name);
  }
  if (t.type === "TSIntersectionType" || t.type === "TSUnionType") {
    return t.types.some(sub => referencesApiType(sub, apiNames));
  }
  return false;
}

// Collects every type reference (name + node) of a signature, descending
// everywhere: generics, unions, intersections, arrays, tuples,
// objects ({ x: A }), functions ((a: A) => B), indexed access...
function collectRefs(t, acc) {
  if (!t) return;
  switch (t.type) {
    case "TSTypeReference":
      acc.push({ name: rootTypeName(t.typeName), node: t.typeName });
      for (const p of typeArgs(t)?.params || []) collectRefs(p, acc);
      break;
    case "TSUnionType":
    case "TSIntersectionType":
      for (const sub of t.types) collectRefs(sub, acc);
      break;
    case "TSArrayType":
      collectRefs(t.elementType, acc);
      break;
    case "TSTupleType":
      for (const el of t.elementTypes || []) collectRefs(el, acc);
      break;
    case "TSParenthesizedType":
    case "TSTypeOperator":
    case "TSNamedTupleMember":
      collectRefs(t.elementType || t.typeAnnotation, acc);
      break;
    case "TSTypeLiteral":
      for (const m of t.members || []) collectRefs(unwrapAnnotation(m.typeAnnotation), acc);
      break;
    case "TSFunctionType":
    case "TSConstructorType":
      for (const p of t.params || []) collectRefs(unwrapAnnotation(p.typeAnnotation), acc);
      collectRefs(unwrapAnnotation(t.returnType), acc);
      break;
    case "TSIndexedAccessType":
      collectRefs(t.objectType, acc);
      collectRefs(t.indexType, acc);
      break;
    default:
      break; // primitives, literals... -> nothing
  }
}

// Gets the "container" type annotation of an ObjectExpression from its position:
// return, variable declaration, arrow body, or `as`.
function containerTypeOf(objExpr) {
  const parent = objExpr.parent;
  if (!parent) return null;
  switch (parent.type) {
    case "VariableDeclarator":
      return parent.init === objExpr ? unwrapAnnotation(parent.id?.typeAnnotation) : null;
    case "TSAsExpression":
    case "TSSatisfiesExpression":
      return parent.typeAnnotation;
    case "ArrowFunctionExpression":
      return parent.body === objExpr ? unwrapAnnotation(parent.returnType) : null;
    case "ReturnStatement": {
      // Walks up to the enclosing function and reads its return type.
      let n = parent.parent;
      while (n && !/Function/.test(n.type)) n = n.parent;
      return n ? unwrapAnnotation(n.returnType) : null;
    }
    default:
      return null;
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "In api/, types used in CoinModuleApi method signatures must be defined in api/types.ts (framework types allowed)",
    },
    schema: [
      {
        type: "object",
        properties: {
          // Names of the API interfaces whose implementation is checked.
          interfaceTypes: { type: "array", items: { type: "string" } },
          // Sources considered as "framework" (regex) -> allowed.
          frameworkSources: { type: "array", items: { type: "string" } },
          // Sources considered as `api/types.ts` (regex) -> allowed.
          localTypesSources: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      notInTypesFile:
        "Dans `api`, le type `{{name}}` utilisé dans une signature de `{{iface}}` doit être défini dans `api/types.ts` (il est importé de `{{source}}`).",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const interfaceTypes = options.interfaceTypes || ["CoinModuleApi"];
    const frameworkSources = (
      options.frameworkSources || ["^@ledgerhq/coin-module-framework(/|$)"]
    ).map(s => new RegExp(s));
    const localTypesSources = (options.localTypesSources || ["^\\./types(\\.ts)?$"]).map(
      s => new RegExp(s),
    );

    const isFramework = src => frameworkSources.some(re => re.test(src));
    const isLocalTypes = src => localTypesSources.some(re => re.test(src));

    const imported = new Map(); // local name -> module source
    const apiNames = new Set(interfaceTypes); // interfaces + local aliases of CoinModuleApi<...>
    const objectExpressions = []; // candidates to analyze at Program:exit

    const interfaceSet = new Set(interfaceTypes);
    const apiArgRefs = []; // refs of the CoinModuleApi<...> type arguments

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") return;
        for (const spec of node.specifiers) {
          if (spec.local) imported.set(spec.local.name, source);
        }
      },
      TSTypeAliasDeclaration(node) {
        // `type XxxCoinModuleApi = CoinModuleApi<...>` -> alias recognized as API.
        if (referencesApiType(node.typeAnnotation, interfaceSet)) {
          apiNames.add(node.id.name);
        }
      },
      TSTypeReference(node) {
        // Type arguments of CoinModuleApi<...> (where it is instantiated:
        // alias, createApi return type...). These types parametrize the methods.
        const name = rootTypeName(node.typeName);
        if (!name || !interfaceSet.has(name)) return;
        for (const p of typeArgs(node)?.params || []) collectRefs(p, apiArgRefs);
      },
      ObjectExpression(node) {
        objectExpressions.push(node);
      },
      "Program:exit"() {
        const reported = new Set(); // dedup by type name, for the whole file

        const check = (ref, iface) => {
          if (!ref.name || reported.has(ref.name)) return;
          const source = imported.get(ref.name);
          if (!source) return; // not imported (local/generic/global) -> ignored
          if (isFramework(source) || isLocalTypes(source)) return; // allowed
          reported.add(ref.name);
          context.report({
            node: ref.node,
            messageId: "notInTypesFile",
            data: { name: ref.name, source, iface },
          });
        };

        // 1) Types passed as CoinModuleApi<...> arguments (Config, Memo, TxData...).
        for (const ref of apiArgRefs) check(ref, "CoinModuleApi");

        // 2) Types appearing in the implementation's method signatures.
        for (const obj of objectExpressions) {
          const containerType = containerTypeOf(obj);
          if (!referencesApiType(containerType, apiNames)) continue;
          const iface = apiDisplayName(containerType, apiNames);
          for (const prop of obj.properties) {
            const fn = prop.value;
            if (!fn || !/Function(Expression)?$/.test(fn.type)) continue;

            const refs = [];
            for (const p of fn.params || []) {
              const target = p.type === "AssignmentPattern" ? p.left : p;
              collectRefs(unwrapAnnotation(target.typeAnnotation), refs);
            }
            collectRefs(unwrapAnnotation(fn.returnType), refs);
            for (const ref of refs) check(ref, iface);
          }
        }
      },
    };
  },
};
