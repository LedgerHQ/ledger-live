const noPlatformSuffixImports = {
  meta: { fixable: "code" },
  createOnce(context) {
    function checkSource(node) {
      const source = node.source?.value;
      if (source?.includes(".web") || source?.includes(".native")) {
        context.report({
          message: "Imports should not contains .web or .native, use --fix to remove them",
          node,
          fix(fixer) {
            const fixed = source.replace(/\.(web|native)/, "");
            return fixer.replaceText(node.source, `"${fixed}"`);
          },
        });
      }
    }

    return {
      before() {},
      ImportDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ExportAllDeclaration: checkSource,
    };
  },
};

export default {
  meta: {
    name: "suffix-imports",
  },
  rules: {
    "no-platform-suffix": noPlatformSuffixImports,
  },
};
