// Rationale and reported shapes: support/lint/README.md#coin-familiesno-family-branch and
// support/lint/README.md#coin-familiesno-currency-id-branch.

import fs from "node:fs";

import { isInFamilies } from "./families-folder.js";

const SKILL = ".agents/skills/coin-families-contract/SKILL.md";

const SCHEMA = [
  {
    type: "object",
    properties: { familiesDir: { type: "string" } },
    additionalProperties: false,
  },
];

const FAMILY_MESSAGE = `Generic code must not branch on a coin family name. Put the behaviour in the family and reach it through the families contract. See ${SKILL}`;

// `cwd` is not available to a plugin's `createOnce`, so the folder is found from this file.
const FAMILIES_DIRECTORY = new URL(
  "../../../libs/ledger-live-common/src/families/",
  import.meta.url,
);

const FAMILIES = new Set(
  fs
    .readdirSync(FAMILIES_DIRECTORY, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name),
);

const CURRENCY_MESSAGE = `Generic code must not branch on a currency id. Put the behaviour in the family of the currency and reach it through the families contract. See ${SKILL}`;

// The registry of currency ids, one file per currency, each declaring its id at the top level.
const CURRENCIES_DIRECTORY = new URL(
  "../../../domain/entity/currency-crypto/src/currencies/",
  import.meta.url,
);
const CURRENCY_ID_DECLARATION = /^ {2}id: "([^"]+)"/m;

/** @type {Set<string>} */
const CURRENCY_IDS = new Set();
for (const file of fs.readdirSync(CURRENCIES_DIRECTORY)) {
  if (!file.endsWith(".ts") || file === "index.ts") continue;
  const source = fs.readFileSync(new URL(file, CURRENCIES_DIRECTORY), "utf8");
  const id = CURRENCY_ID_DECLARATION.exec(source)?.[1];
  if (id) CURRENCY_IDS.add(id);
}

// Only the names that hold a family. `fontFamily` and `deviceFamily` are not families.
const FAMILY_IDENTIFIER = /^(?:family|currencyFamily|.+CurrencyFamily)$/;
// Only the names that hold a currency id. `accountId` and `tokenId` are not currency ids.
const CURRENCY_ID_NAME = /^(?:currencyId|.+CurrencyId)$/;

const EQUALITY_OPERATORS = new Set(["===", "!==", "==", "!="]);
const MEMBERSHIP_METHODS = new Set(["includes", "has", "indexOf"]);
const TRANSPARENT_WRAPPERS = new Set([
  "ChainExpression",
  "ParenthesizedExpression",
  "TSAsExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
]);

/**
 * @param {any} node
 * @returns {any} `node` without the wrappers that do not change what it evaluates to
 */
function unwrap(node) {
  let current = node;
  while (current && TRANSPARENT_WRAPPERS.has(current.type)) current = current.expression;
  return current;
}

/**
 * @param {any} node
 * @returns {string | undefined} the text of a string literal, or of a template literal with no substitution
 */
function stringValue(node) {
  const target = unwrap(node);
  if (target?.type === "Literal" && typeof target.value === "string") return target.value;
  if (target?.type === "TemplateLiteral" && target.expressions?.length === 0) {
    return target.quasis?.[0]?.value?.cooked ?? undefined;
  }
  return undefined;
}

/**
 * @param {any} node
 * @returns {boolean} whether `node` reads a family: `.family`, or a name that holds one
 */
function isFamilyExpression(node) {
  const target = unwrap(node);
  if (target?.type === "Identifier") return FAMILY_IDENTIFIER.test(target.name);
  return (
    target?.type === "MemberExpression" &&
    !target.computed &&
    target.property?.type === "Identifier" &&
    target.property.name === "family"
  );
}

/**
 * @param {any} node
 * @returns {boolean} whether `node` reads a currency id: `.currency.id`, `currency.id`, or a name that holds one
 */
function isCurrencyIdExpression(node) {
  const target = unwrap(node);
  if (target?.type === "Identifier") return CURRENCY_ID_NAME.test(target.name);
  if (target?.type !== "MemberExpression" || target.computed) return false;
  if (target.property?.type !== "Identifier") return false;
  if (CURRENCY_ID_NAME.test(target.property.name)) return true;

  const owner = unwrap(target.object);
  const isCurrency =
    (owner?.type === "Identifier" && owner.name === "currency") ||
    (owner?.type === "MemberExpression" &&
      !owner.computed &&
      owner.property?.type === "Identifier" &&
      owner.property.name === "currency");
  return target.property.name === "id" && isCurrency;
}

/**
 * @param {(node: any) => boolean} isLiteral
 * @returns {(node: any) => boolean} whether a node is an array literal, or a `new Set` of one, that holds a literal
 */
function listHolding(isLiteral) {
  return node => {
    const target = unwrap(node);
    const isSet =
      target?.type === "NewExpression" &&
      target.callee?.type === "Identifier" &&
      target.callee.name === "Set";
    const list = isSet ? unwrap(target.arguments?.[0]) : target;
    return list?.type === "ArrayExpression" && list.elements.some(isLiteral);
  };
}

/** @param {any} node */
const isFamilyLiteral = node => FAMILIES.has(stringValue(node) ?? "");

/** @param {any} node */
const isCurrencyIdLiteral = node => CURRENCY_IDS.has(stringValue(node) ?? "");

/**
 * @param {{ isExpression: (node: any) => boolean, isList: (node: any) => boolean, isLiteral: (node: any) => boolean, message: string }} branch
 *   what a branch is for one kind of name: the expression that reads it, the literal it is compared to and
 *   the list that holds such literals
 */
function createBranchRule({ isExpression, isList, isLiteral, message }) {
  const isBranch = (/** @type {any} */ expression, /** @type {any} */ literal) =>
    isExpression(expression) && isLiteral(literal);

  return {
    meta: { schema: SCHEMA },
    createOnce(context) {
      let inFamilies = false;
      /** @type {Set<string>} */
      let listNames = new Set();
      /** @type {{ name: string, node: any }[]} */
      let membershipChecks = [];

      /** @param {any} node */
      function report(node) {
        if (!inFamilies) context.report({ message, node });
      }

      return {
        before() {
          inFamilies = isInFamilies(context.filename, context.options?.[0]?.familiesDir);
          listNames = new Set();
          membershipChecks = [];
        },
        BinaryExpression(node) {
          if (!EQUALITY_OPERATORS.has(node.operator)) return;
          if (isBranch(node.left, node.right) || isBranch(node.right, node.left)) report(node);
        },
        SwitchStatement(node) {
          if (!isExpression(node.discriminant)) return;
          for (const switchCase of node.cases) {
            if (isLiteral(switchCase.test)) report(switchCase.test);
          }
        },
        VariableDeclaration(node) {
          if (node.kind !== "const") return;
          for (const declarator of node.declarations) {
            if (declarator.id?.type === "Identifier" && isList(declarator.init)) {
              listNames.add(declarator.id.name);
            }
          }
        },
        CallExpression(node) {
          const callee = unwrap(node.callee);
          if (callee?.type !== "MemberExpression" || callee.computed) return;
          if (!MEMBERSHIP_METHODS.has(callee.property?.name)) return;
          if (!isExpression(node.arguments?.[0])) return;

          const list = unwrap(callee.object);
          if (isList(list)) report(node);
          else if (list?.type === "Identifier") membershipChecks.push({ name: list.name, node });
        },
        // A list is often declared below the function that reads it, so the names are matched once the
        // whole file is seen.
        "Program:exit"() {
          for (const { name, node } of membershipChecks) {
            if (listNames.has(name)) report(node);
          }
        },
      };
    },
  };
}

const noFamilyBranch = createBranchRule({
  isExpression: isFamilyExpression,
  isList: listHolding(isFamilyLiteral),
  isLiteral: isFamilyLiteral,
  message: FAMILY_MESSAGE,
});

const noCurrencyIdBranch = createBranchRule({
  isExpression: isCurrencyIdExpression,
  isList: listHolding(isCurrencyIdLiteral),
  isLiteral: isCurrencyIdLiteral,
  message: CURRENCY_MESSAGE,
});

export { noCurrencyIdBranch, noFamilyBranch };
