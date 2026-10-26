// ESLint's `no-restricted-syntax`, which oxlint does not implement: options are `{ selector, message }`.
const noRestrictedSyntax = {
  meta: { schema: false },
  create(context) {
    return Object.fromEntries(
      context.options.map(({ selector, message }) => [
        selector,
        node => context.report({ node, message }),
      ]),
    );
  },
};

export default {
  meta: {
    name: "restricted-syntax",
  },
  rules: {
    "no-restricted-syntax": noRestrictedSyntax,
  },
};
