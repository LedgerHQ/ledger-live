/**
 * Babel plugin to inject `collapsable={false}` to all React Native components
 *
 * This prevents view collapsing in Detox tests, making elements more reliably
 * findable. This plugin should only be enabled when `process.env.DETOX` is set
 * (see `babel.config.js`). When enabled, it injects `collapsable={false}` to
 * disable view flattening entirely for Detox tests.
 */
module.exports = function collapsablePlugin({ types: t }) {
  // Whitelist of packages to transform (workspace packages)
  const ALLOWED_PACKAGES = [
    "@ledgerhq/native-ui",
    // Add more @ledgerhq packages here if needed
  ];

  return {
    name: "inject-collapsable-prop",
    visitor: {
      Program: {
        enter(path, state) {
          const filename = state.file.opts.filename;

          if (!filename) {
            state.skipFile = true;
            return;
          }

          // Skip if file is in node_modules and not a whitelisted package
          // For non-node_modules files, only process src/ directory
          if (filename.includes("node_modules")) {
            const isWhitelisted = ALLOWED_PACKAGES.some(
              pkg =>
                filename.includes(`node_modules/${pkg}`) ||
                filename.includes(`node_modules\\${pkg}`),
            );

            if (!isWhitelisted) {
              state.skipFile = true;
              return;
            }
          } else if (!filename.includes("/src/") && !filename.includes("\\src\\")) {
            state.skipFile = true;
            return;
          }
        },
      },

      JSXOpeningElement(path, state) {
        if (state.skipFile) {
          return;
        }

        const elementName = path.node.name.name;
        if (!elementName) {
          return;
        }

        // Inject `collapsable={false}` into ALL components without exclusion
        // React Native will ignore the prop on components that don't support
        // it (e.g. Text, Image, etc.). We need to check if `collapsable` prop
        // already exists to avoid injecting it multiple times
        const hasCollapsable = path.node.attributes.some(
          attr => attr?.name?.name === "collapsable",
        );

        if (!hasCollapsable) {
          const collapsableValue = t.jsxExpressionContainer(t.booleanLiteral(false));
          const newAttribute = t.jsxAttribute(t.jsxIdentifier("collapsable"), collapsableValue);
          path.node.attributes.push(newAttribute);
        }
      },
    },
  };
};
