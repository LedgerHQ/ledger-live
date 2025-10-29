/* eslint-disable no-console */
module.exports = function ({ types: t }) {
  console.log("[Babel Plugin] Plugin initialized");
  const importedComponents = new Map();

  function transformRegisterCall(path, importPathValue) {
    console.log(`[Babel Plugin] transformRegisterCall: ${importPathValue}`);
    const program = path.scope.getProgramParent().path;
    const componentName = `_ImportedComponent_${importedComponents.size}`;
    importedComponents.set(componentName, importPathValue);

    const importDeclaration = t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier(componentName))],
      t.stringLiteral(importPathValue),
    );

    program.unshiftContainer("body", importDeclaration);
    console.log(`[Babel Plugin] Created import: import ${componentName} from "${importPathValue}"`);
    return t.identifier(componentName);
  }

  function extractImportPath(node) {
    if (!t.isCallExpression(node)) {
      return null;
    }

    if (!t.isIdentifier(node.callee, { name: "register" })) {
      return null;
    }

    if (node.arguments.length !== 1) {
      console.log(
        `[Babel Plugin] extractImportPath: register call has ${node.arguments.length} arguments, expected 1`,
      );
      return null;
    }

    if (!t.isObjectExpression(node.arguments[0])) {
      console.log(
        `[Babel Plugin] extractImportPath: register argument is not an object expression`,
      );
      return null;
    }

    const objExpr = node.arguments[0];
    const loaderProp = objExpr.properties.find(
      prop =>
        t.isObjectProperty(prop) &&
        t.isIdentifier(prop.key, { name: "loader" }) &&
        t.isArrowFunctionExpression(prop.value) &&
        prop.value.params.length === 0 &&
        t.isCallExpression(prop.value.body) &&
        t.isImport(prop.value.body.callee),
    );

    if (!loaderProp) {
      console.log(
        `[Babel Plugin] extractImportPath: loader property not found or doesn't match expected pattern`,
      );
      return null;
    }

    const importCall = loaderProp.value.body;
    const importPath = importCall.arguments[0];
    if (!t.isStringLiteral(importPath)) {
      console.log(`[Babel Plugin] extractImportPath: import path is not a string literal`);
      return null;
    }

    const pathValue = importPath.value;
    console.log(`[Babel Plugin] extractImportPath: found import path "${pathValue}"`);
    return pathValue;
  }

  return {
    visitor: {
      Program(path, state) {
        const isDevEnv = process.env.NODE_ENV !== "production";
        const forceLazyLocally = process.env.FORCE_LAZY_LOCALLY === "true";
        const shouldTransform = isDevEnv && !forceLazyLocally;
        const filename = state.file?.opts?.filename || "unknown";
        console.log(
          `[Babel Plugin] Visiting Program: ${filename}, NODE_ENV: ${process.env.NODE_ENV}, FORCE_LAZY_LOCALLY: ${process.env.FORCE_LAZY_LOCALLY}, shouldTransform: ${shouldTransform}`,
        );
        state.shouldTransform = shouldTransform;
      },
      VariableDeclarator(path, state) {
        if (!state.shouldTransform) {
          console.log(
            `[Babel Plugin] Skipping VariableDeclarator because shouldTransform is false`,
          );
          return;
        }

        const { node } = path;
        if (!node.init) {
          return;
        }

        console.log(`[Babel Plugin] Visiting VariableDeclarator: ${node.id?.name || "unnamed"}`);
        const importPathValue = extractImportPath(node.init);

        if (importPathValue) {
          const varName = node.id.name;
          const moduleName = `_${varName}Module`;
          console.log(
            `[Babel Plugin] Transforming VariableDeclarator: ${varName} = register(...) -> import * as ${moduleName} from "${importPathValue}"; const ${varName} = ${moduleName}.${varName} || ${moduleName}.default`,
          );

          const importDeclaration = t.importDeclaration(
            [t.importNamespaceSpecifier(t.identifier(moduleName))],
            t.stringLiteral(importPathValue),
          );

          const varDeclaration = t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier(varName),
              t.logicalExpression(
                "||",
                t.memberExpression(t.identifier(moduleName), t.identifier(varName)),
                t.memberExpression(t.identifier(moduleName), t.identifier("default")),
              ),
            ),
          ]);

          const parentPath = path.parentPath;
          const statements = [importDeclaration, varDeclaration];

          if (
            t.isVariableDeclaration(parentPath.node) &&
            parentPath.node.declarations.length === 1
          ) {
            parentPath.replaceWithMultiple(statements);
          } else {
            parentPath.insertBefore(importDeclaration);
            path.replaceWith(varDeclaration.declarations[0]);
          }
        } else {
          console.log(
            `[Babel Plugin] VariableDeclarator ${node.id?.name || "unnamed"} does not match register pattern`,
          );
        }
      },
      CallExpression(path, state) {
        if (!state.shouldTransform) {
          return;
        }

        const { node } = path;

        if (t.isIdentifier(node.callee, { name: "register" })) {
          console.log(`[Babel Plugin] Visiting CallExpression: register(...)`);
        }

        const importPathValue = extractImportPath(node);

        if (importPathValue) {
          const isInVariableDeclarator = path.findParent(p => t.isVariableDeclarator(p.node));
          if (isInVariableDeclarator) {
            console.log(
              `[Babel Plugin] CallExpression is inside VariableDeclarator, skipping (will be handled by VariableDeclarator visitor)`,
            );
            return;
          }

          console.log(
            `[Babel Plugin] Transforming CallExpression: register(...) -> _ImportedComponent_X`,
          );
          const replacement = transformRegisterCall(path, importPathValue);
          path.replaceWith(replacement);
        }
      },
    },
  };
};
