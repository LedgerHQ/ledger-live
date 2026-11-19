// Rationale and reported shapes: support/lint/README.md#storageno-engine-import-and-storageno-port-import.

const ENGINE_PACKAGES = new Set([
  "react-native-mmkv",
  "@react-native-async-storage/async-storage",
  "electron-store",
]);
const WEB_STORAGE_GLOBALS = new Set(["localStorage", "sessionStorage"]);
const GLOBAL_OBJECTS = new Set(["window", "globalThis", "self"]);
const PORT_PACKAGE = /^@shared\/storage(?:\/|$)/;

const ADAPTER_PACKAGE = /(?:^|[/\\])shared[/\\]storage-[^/\\]+[/\\]/;
const PORT_USERS = [
  /(?:^|[/\\])shared[/\\]storage[/\\]/,
  ADAPTER_PACKAGE,
  /(?:^|[/\\])features[/\\]platform[/\\]persistence[/\\]/,
  /(?:^|[/\\])apps[/\\][^/\\]+[/\\]src[/\\]persistence[/\\]/,
  // The composition root of the e2e seeds, which write app.json through the accounts record.
  /(?:^|[/\\])libs[/\\]live-e2e-shared[/\\]src[/\\]userdataAccounts(?:\.test)?\.ts$/,
];

const MESSAGES = {
  engine:
    "Only a storage adapter (shared/storage-*) talks to a storage engine. Define a record for @features/platform-persistence instead",
  port: "Only persistence, the storage adapters and the app composition roots (apps/*/src/persistence/) import @shared/storage",
};

/**
 * @param {string | undefined} filename
 * @returns {boolean}
 */
function isAdapterFile(filename) {
  return typeof filename === "string" && ADAPTER_PACKAGE.test(filename);
}

/**
 * @param {string | undefined} filename
 * @returns {boolean}
 */
function isPortUserFile(filename) {
  return typeof filename === "string" && PORT_USERS.some(pattern => pattern.test(filename));
}

/**
 * @param {unknown} specifier
 * @returns {boolean}
 */
function isEnginePackage(specifier) {
  if (typeof specifier !== "string") return false;
  return [...ENGINE_PACKAGES].some(name => specifier === name || specifier.startsWith(`${name}/`));
}

/**
 * @param {unknown} specifier
 * @returns {boolean}
 */
function isPortPackage(specifier) {
  return typeof specifier === "string" && PORT_PACKAGE.test(specifier);
}

/**
 * @param {{ callee?: { type: string, name?: string, object?: { type: string, name?: string }, property?: { type: string, name?: string } } }} node
 * @returns {boolean} whether the call takes a module specifier as its first argument
 */
function isSpecifierCall(node) {
  const callee = node.callee;
  if (!callee) return false;
  if (callee.type === "Identifier") return callee.name === "require";
  return (
    callee.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "jest" &&
    callee.property?.type === "Identifier" &&
    ["mock", "doMock", "requireActual"].includes(callee.property.name ?? "")
  );
}

/**
 * A rule that reports each module specifier `matches` accepts, unless `isAllowedFile` accepts the
 * importing file.
 *
 * @param {(specifier: unknown) => boolean} matches
 * @param {(filename: string | undefined) => boolean} isAllowedFile
 * @param {string} message
 * @param {(context: any) => Record<string, (node: any) => void>} [extraVisitors]
 */
function importRule(matches, isAllowedFile, message, extraVisitors = () => ({})) {
  return {
    createOnce(context) {
      let allowed = false;

      /** @param {{ value?: unknown } | undefined} literal */
      function report(literal) {
        if (allowed || !matches(literal?.value)) return;
        context.report({ message, node: literal });
      }

      /** @param {{ source?: { value?: unknown } }} node */
      function checkSource(node) {
        report(node.source);
      }

      const extra = extraVisitors(context);

      return {
        before() {
          allowed = isAllowedFile(context.filename);
        },
        ImportDeclaration: checkSource,
        ExportNamedDeclaration: checkSource,
        ExportAllDeclaration: checkSource,
        ImportExpression: checkSource,
        TSImportType: checkSource,
        CallExpression(node) {
          if (isSpecifierCall(node)) report(node.arguments?.[0]);
        },
        ...Object.fromEntries(
          Object.entries(extra).map(([type, visit]) => [
            type,
            node => {
              if (!allowed) visit(node);
            },
          ]),
        ),
      };
    },
  };
}

/**
 * @param {{ type: string, computed?: boolean, object?: { type: string, name?: string }, property?: { type: string, name?: string } }} node
 * @returns {boolean} whether the member expression reads `localStorage`, `sessionStorage`, or one
 * of them through `window`, `globalThis` or `self`
 */
function isWebStorageAccess(node) {
  if (node.object?.type === "Identifier" && WEB_STORAGE_GLOBALS.has(node.object.name ?? "")) {
    return true;
  }
  return (
    !node.computed &&
    node.object?.type === "Identifier" &&
    GLOBAL_OBJECTS.has(node.object.name ?? "") &&
    node.property?.type === "Identifier" &&
    WEB_STORAGE_GLOBALS.has(node.property.name ?? "")
  );
}

const noEngineImport = importRule(isEnginePackage, isAdapterFile, MESSAGES.engine, context => ({
  MemberExpression(node) {
    if (isWebStorageAccess(node)) context.report({ message: MESSAGES.engine, node });
  },
}));

const noPortImport = importRule(isPortPackage, isPortUserFile, MESSAGES.port);

export { isAdapterFile, isEnginePackage, isPortPackage, isPortUserFile };

export default {
  meta: {
    name: "storage",
  },
  rules: {
    "no-engine-import": noEngineImport,
    "no-port-import": noPortImport,
  },
};
