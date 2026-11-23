// Rationale: support/lint/README.md#sensitiveno-sensitive-in-text.

import { createRequire } from "node:module";

// Type-aware: runs on ESLint with @typescript-eslint/parser and a TypeScript program.
const require = createRequire(import.meta.url);
/** @type {typeof import("typescript")} */
let ts;

const BRAND = "Sensitive";
// zod 4 `$brand` is a unique symbol, which the checker names `__@$brand@<id>`.
const BRAND_KEY = "__@$brand";
const MAX_DEPTH = 6;

const CALL_SINKS = new Set(["log", "invariant", "String", "JSON.stringify"]);

/**
 * @param {import("typescript").TypeChecker} checker
 * @param {import("typescript").Program} program
 */
function sensitivity(checker, program) {
  /** @type {WeakMap<import("typescript").Type, boolean>} */
  const cache = new WeakMap();

  // A library class or interface (Date, Map, a React element): mapped and inferred types still walk.
  const isLibraryClass = type => {
    const symbol = type.getSymbol();
    if (!symbol || !(symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)))
      return false;
    return (symbol.getDeclarations() ?? []).some(declaration => {
      const file = declaration.getSourceFile();
      return (
        program.isSourceFileDefaultLibrary(file) || program.isSourceFileFromExternalLibrary(file)
      );
    });
  };

  const hasSensitiveBrand = type =>
    checker
      .getPropertiesOfType(type)
      .some(
        property =>
          property.getName().startsWith(BRAND_KEY) &&
          checker
            .getPropertiesOfType(checker.getTypeOfSymbol(property))
            .some(inner => inner.getName() === BRAND),
      );

  /**
   * @param {import("typescript").Type} type
   * @param {Set<import("typescript").Type>} seen
   * @param {number} depth
   * @returns {boolean}
   */
  const walk = (type, seen, depth) => {
    if (depth > MAX_DEPTH || seen.has(type)) return false;
    seen.add(type);
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never)) return false;
    if (type.isUnionOrIntersection()) return type.types.some(part => walk(part, seen, depth));
    if (!(type.flags & ts.TypeFlags.Object)) return false;
    if (hasSensitiveBrand(type)) return true;
    if (checker.isArrayType(type) || checker.isTupleType(type))
      return checker.getTypeArguments(type).some(element => walk(element, seen, depth + 1));
    if (checker.getSignaturesOfType(type, ts.SignatureKind.Call).length > 0) return false;
    if (checker.getSignaturesOfType(type, ts.SignatureKind.Construct).length > 0) return false;
    if (isLibraryClass(type)) return false;
    return checker.getPropertiesOfType(type).some(property => {
      const declaration = property.valueDeclaration;
      if (declaration && (ts.isMethodDeclaration(declaration) || ts.isMethodSignature(declaration)))
        return false;
      return walk(checker.getTypeOfSymbol(property), seen, depth + 1);
    });
  };

  return type => {
    const cached = cache.get(type);
    if (cached !== undefined) return cached;
    const result = walk(type, new Set(), 0);
    cache.set(type, result);
    return result;
  };
}

/** @param {any} callee */
function calleeName(callee) {
  if (callee.type === "Identifier") return callee.name;
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    callee.property.type === "Identifier"
  )
    return `${callee.object.name}.${callee.property.name}`;
  return "";
}

const isCallSink = name => CALL_SINKS.has(name) || name.startsWith("console.");

/** @type {import("eslint").Rule.RuleModule} */
export const noSensitiveInText = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a value of a `Sensitive`-branded type in text: template literals, concatenations, logs, errors",
    },
    messages: {
      leak: "Sensitive value (account key or address) {{where}}: pass its AccountUUID, or maskAccountKey() for display.",
    },
    schema: [],
  },
  create(context) {
    const services = context.sourceCode?.parserServices ?? context.parserServices;
    if (!services?.program || !services.esTreeNodeToTSNodeMap) return {};
    ts ??= require("typescript");
    const checker = services.program.getTypeChecker();
    const isSensitiveType = sensitivity(checker, services.program);
    const isSensitive = node =>
      isSensitiveType(checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node)));
    const check = (node, where) => {
      if (isSensitive(node)) context.report({ node, messageId: "leak", data: { where } });
    };

    return {
      TemplateLiteral(node) {
        if (node.parent?.type === "TaggedTemplateExpression") return;
        for (const expression of node.expressions) check(expression, "in a template literal");
      },
      BinaryExpression(node) {
        if (node.operator !== "+") return;
        check(node.left, "in a string concatenation");
        check(node.right, "in a string concatenation");
      },
      CallExpression(node) {
        const name = calleeName(node.callee);
        if (!isCallSink(name)) return;
        for (const argument of node.arguments) check(argument, `passed to ${name}()`);
      },
      NewExpression(node) {
        const name = calleeName(node.callee);
        if (node.callee.type !== "Identifier" || !name.endsWith("Error")) return;
        for (const argument of node.arguments) check(argument, `passed to new ${name}()`);
      },
    };
  },
};

export default {
  meta: { name: "sensitive" },
  rules: { "no-sensitive-in-text": noSensitiveInText },
};
