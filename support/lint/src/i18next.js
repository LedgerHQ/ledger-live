import i18next from "eslint-plugin-i18next";

const rule = i18next.rules["no-literal-string"];

// The rule still calls the ESLint 8 context API, which oxlint does not provide.
const noLiteralString = {
  ...rule,
  create(context) {
    let current;
    const legacy = {
      parserServices: {},
      getAncestors: () => context.sourceCode.getAncestors(current),
      getSourceCode: () => context.sourceCode,
    };
    const visitors = rule.create(
      new Proxy(context, { get: (target, key) => (key in legacy ? legacy[key] : target[key]) }),
    );
    return Object.fromEntries(
      Object.entries(visitors).map(([selector, visit]) => [
        selector,
        node => {
          current = node;
          return visit(node);
        },
      ]),
    );
  },
};

export default {
  meta: {
    name: "i18next",
  },
  rules: {
    "no-literal-string": noLiteralString,
  },
};
