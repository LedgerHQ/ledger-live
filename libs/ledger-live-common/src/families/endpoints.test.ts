import fs from "fs";
import glob from "glob";
import path from "path";
import ts from "typescript";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { liveConfig } from "../config/sharedConfig";

/**
 * Where coin-module backend endpoints may come from.
 *
 * 1. A mainnet endpoint never points at a Ledger staging host.
 * 2. A coin-module reads its endpoints from its coin config (`config_currency_<id>`, whose defaults
 *    live in `families/<family>/config.ts` and which Firebase can override on a shipped release):
 *    it neither hardcodes an endpoint nor reads one through `getEnv`, and the family code that
 *    wires it passes that coin config through rather than endpoints read from the environment.
 *    `config.ts` files hold config defaults, so they are exempt.
 */

const COIN_MODULES_DIR = path.resolve(__dirname, "../../../coin-modules");
const FAMILIES_DIR = __dirname;

const STAGING_HOST = /^[a-z]+:\/\/([^/?#]*\.)?ledger-test\.com([/:?#]|$)/i;
const NON_MAINNET_CONTEXT = /testnet|devnet|regtest|staging|stg|preprod|ppr/i;
const ENDPOINT_URL = /^(https?|wss?):\/\/[^/\s]/;
const ENDPOINT_ENV_NAME =
  /(^|_)(URL|ENDPOINT|EXPLORER|INDEXER)(_|$)|^NODE_|_NODE$|_(API|PROXY|SERVICE)$/;

const NON_SHIPPED_FILES = [
  "**/*.test.*",
  "**/*.spec.*",
  "**/__tests__/**",
  "**/__mocks__/**",
  "**/*mock*",
  "**/*mock*/**",
  "**/fixtures/**",
  "**/fixtures.*",
  "**/*.fixture.*",
  "**/test/**",
  "**/tests/**",
];

// Shown to the user (help articles, explorers, avatars), never called by the module.
const USER_FACING_LINK_PREFIXES = [
  "https://support.ledger.com/",
  "https://www.ledger.com/",
  "https://explorer.aptoslabs.com/",
  "https://explorer.multiversx.com",
  "https://s3.amazonaws.com/keybase_processed_uploads/",
];

// Shared Ledger services the EVM signer is built with, not per-coin endpoints. Remove an entry
// once it moves out of getEnv; the test fails on an entry that no longer matches.
const SHARED_SERVICE_ENV_READS: Record<string, string[]> = {
  "evm/signer.ts": ["CAL_SERVICE_URL", "DYNAMIC_CAL_BASE_URL", "NFT_METADATA_SERVICE"],
  "evm/utils.ts": ["CAL_SERVICE_URL"],
};

type UrlLiteral = { file: string; url: string; context: string };
type EnvRead = { file: string; name: string };

const declarationName = (node: ts.Node): string | undefined => {
  if (
    (ts.isVariableDeclaration(node) ||
      ts.isPropertyAssignment(node) ||
      ts.isPropertyDeclaration(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node)) &&
    node.name
  ) {
    return node.name.getText();
  }
  return undefined;
};

// Names of the declarations enclosing a node, e.g. "ZCASH_GRPC_URL_MAINNET".
const enclosingNames = (node: ts.Node): string => {
  const names: string[] = [];
  for (let current: ts.Node | undefined = node; current; current = current.parent) {
    const name = declarationName(current);
    if (name) names.push(name);
  }
  return names.join(".");
};

const scan = (
  dir: string,
  pattern: string,
  ignore: string[],
): { files: string[]; urls: UrlLiteral[]; envReads: EnvRead[] } => {
  const files: string[] = glob.sync(pattern, {
    cwd: dir,
    ignore: [...NON_SHIPPED_FILES, ...ignore],
  });
  const urls: UrlLiteral[] = [];
  const envReads: EnvRead[] = [];

  for (const file of files) {
    const source = fs.readFileSync(path.join(dir, file), "utf8");
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node): void => {
      if (
        (ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node) ||
          ts.isTemplateHead(node)) &&
        ENDPOINT_URL.test(node.text)
      ) {
        urls.push({ file, url: node.text, context: enclosingNames(node) });
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "getEnv" &&
        node.arguments[0] &&
        ts.isStringLiteralLike(node.arguments[0])
      ) {
        envReads.push({ file, name: node.arguments[0].text });
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return { files, urls, envReads };
};

const collectStrings = (
  value: unknown,
  keyPath: string,
  out: { keyPath: string; value: string }[],
) => {
  if (typeof value === "string") {
    out.push({ keyPath, value });
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectStrings(child, `${keyPath}.${key}`, out);
    }
  }
  return out;
};

const isTestnetCurrency = (currencyId: string): boolean =>
  Boolean(findCryptoCurrencyById(currencyId)?.isTestnetFor);

const endpointEnvReads = (envReads: EnvRead[]): EnvRead[] =>
  envReads.filter(({ name }) => ENDPOINT_ENV_NAME.test(name));

describe("coin-module endpoints", () => {
  const coinModules = scan(COIN_MODULES_DIR, "*/src/**/*.{ts,tsx}", []);
  const families = scan(FAMILIES_DIR, "*/**/*.{ts,tsx}", ["*/config.ts"]);

  it("scans every coin-module", () => {
    const modules = fs
      .readdirSync(COIN_MODULES_DIR)
      .filter(name => fs.existsSync(path.join(COIN_MODULES_DIR, name, "src")));
    const scanned = new Set(coinModules.files.map(file => file.split("/")[0]));

    expect([...scanned].sort()).toEqual(modules.sort());
  });

  describe("a mainnet endpoint never points at ledger-test.com", () => {
    it("in the currency live config defaults", () => {
      const offenders = Object.entries(liveConfig)
        .filter(([key]) => key.startsWith("config_currency_"))
        .filter(([key]) => !isTestnetCurrency(key.slice("config_currency_".length)))
        .flatMap(([key, info]) => collectStrings(info.default, key, []))
        .filter(
          ({ keyPath, value }) => STAGING_HOST.test(value) && !NON_MAINNET_CONTEXT.test(keyPath),
        )
        .map(({ keyPath, value }) => `${keyPath} = ${value}`);

      expect(offenders).toEqual([]);
    });

    it("in the coin-modules sources", () => {
      const offenders = coinModules.urls
        .filter(({ url, context }) => STAGING_HOST.test(url) && !NON_MAINNET_CONTEXT.test(context))
        .map(({ file, url, context }) => `${file} ${context || "<anonymous>"} = ${url}`);

      expect(offenders).toEqual([]);
    });
  });

  describe("a coin-module reads its endpoints from its coin config", () => {
    it("no coin-module hardcodes an endpoint outside its config.ts", () => {
      const offenders = coinModules.urls
        .filter(({ file }) => !file.endsWith("/src/config.ts"))
        .filter(({ url }) => !USER_FACING_LINK_PREFIXES.some(prefix => url.startsWith(prefix)))
        .map(({ file, url }) => `${file}: ${url}`);

      expect(offenders).toEqual([]);
    });

    it("no coin-module reads an endpoint through getEnv", () => {
      const offenders = endpointEnvReads(coinModules.envReads).map(
        ({ file, name }) => `${file}: getEnv("${name}")`,
      );

      expect(offenders).toEqual([]);
    });

    it("no family wires a coin-module with an endpoint read through getEnv", () => {
      const offenders = endpointEnvReads(families.envReads)
        .filter(({ file, name }) => !SHARED_SERVICE_ENV_READS[file]?.includes(name))
        .map(({ file, name }) => `${file}: getEnv("${name}")`);

      expect(offenders).toEqual([]);
    });

    it("every shared-service exception still applies", () => {
      const stale = Object.entries(SHARED_SERVICE_ENV_READS).flatMap(([file, names]) =>
        names
          .filter(name => !families.envReads.some(read => read.file === file && read.name === name))
          .map(name => `${file}: getEnv("${name}")`),
      );

      expect(stale).toEqual([]);
    });
  });
});
