// polyfill the unfinished support of apps logic
import uniq from "lodash/uniq";
import semver from "semver";
import {
  listCryptoCurrencies,
  findCryptoCurrencyById,
} from "@ledgerhq/cryptoassets";
import { App, Application } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
const directDep = {};
const reverseDep = {};

// whitelist dependencies
export const whitelistDependencies = [
  "Decred",
  "Decred Test",
  "Bitcoin",
  "Bitcoin Test",
  "Zcash",
  "Avalanche",
  "Avalanche Test",
];

export function declareDep(name: string, dep: string): void {
  if (whitelistDependencies.includes(name)) {
    return;
  }
  directDep[name] = (directDep[name] || []).concat(dep);
  reverseDep[dep] = (reverseDep[dep] || []).concat(name);
}

// extra dependencies
[
  ["LBRY", "Bitcoin"],
  ["Ravencoin", "Bitcoin"],
  ["Resistance", "Bitcoin"],
  ["ZenCash", "Bitcoin"],
  ["[ L ] Market", "Ethereum"],
  ["1inch", "Ethereum"],
  ["Aave", "Ethereum"],
  ["Alkemi", "Ethereum"],
  ["Angle", "Ethereum"],
  ["APWine", "Ethereum"],
  ["ArtBlocks", "Ethereum"],
  ["ARTIS sigma1", "Ethereum"],
  ["cBridge", "Ethereum"],
  ["Cometh", "Ethereum"],
  ["Compound", "Ethereum"],
  ["DODO", "Ethereum"],
  ["EnergyWebChain", "Ethereum"],
  ["Euler", "Ethereum"],
  ["Harvest", "Ethereum"],
  ["Kiln", "Ethereum"],
  ["kUSD", "Ethereum"],
  ["Lido", "Ethereum"],
  ["Morpho", "Ethereum"],
  ["Nested", "Ethereum"],
  ["OlympusDAO", "Ethereum"],
  ["Opensea", "Ethereum"],
  ["Paraswap", "Ethereum"],
  ["POAP", "Ethereum"],
  ["Rarible", "Ethereum"],
  ["Ricochet", "Ethereum"],
  ["RocketPool", "Ethereum"],
  ["RSK Test", "Ethereum"],
  ["RSK", "Ethereum"],
  ["Spool", "Ethereum"],
  ["Staderlabs", "Ethereum"],
  ["StakeDAO", "Ethereum"],
  ["ThunderCore", "Ethereum"],
  ["Volta", "Ethereum"],
  ["Yearn", "Ethereum"],
].forEach(([name, dep]) => declareDep(name, dep));

// Nb Starting on version 2.1.0 Bitcoin family apps no longer depend on
// Bitcoin as a library. We will soon have the dependencies resolved from
// back-end but until then we need to manually remove them.
const versionBasedWhitelistDependencies = {
  Bitcoin: "2.1.0",
};

export const getDependencies = (
  appName: string,
  appVersion?: string
): string[] => {
  const maybeDirectDep = directDep[appName] || [];

  if (!appVersion || !maybeDirectDep.length) {
    return maybeDirectDep;
  }

  // If we don't have any direct dependencies, or the caller didn't
  // provide `appVersion` to compare against, we can skip the filter
  return maybeDirectDep.filter((dep: string) => {
    const maybeDep = versionBasedWhitelistDependencies[dep];
    return !maybeDep || semver.lt(semver.coerce(appVersion) ?? "", maybeDep);
  });
};

export const getDependents = (appName: string): string[] =>
  reverseDep[appName] || [];
export const polyfillApplication = (app: Application): Application => {
  const crypto = listCryptoCurrencies(true, true).find(
    (crypto) =>
      app.name.toLowerCase() === crypto.managerAppName.toLowerCase() &&
      (crypto.managerAppName !== "Ethereum" ||
        // if it's ethereum, we have a specific case that we must only allow the Ethereum app
        app.name === "Ethereum")
  );

  if (crypto && !app.currencyId) {
    return { ...app, currencyId: crypto.id };
  }

  return app;
};

export const calculateDependencies = (): void => {
  listCryptoCurrencies(true, true).forEach((currency: CryptoCurrency) => {
    if (!currency.managerAppName) return; // no app for this currency

    const family = findCryptoCurrencyById(currency.family);

    if (!family || !family.managerAppName) return; // no dep
    if (family.managerAppName === currency.managerAppName) return; // same app

    declareDep(currency.managerAppName, family.managerAppName);
    if (!currency.isTestnetFor) {
      declareDep(currency.managerAppName + " Test", family.managerAppName);
    }
  });
};

export const polyfillApp = (app: App): App => {
  const dependencies = whitelistDependencies.includes(app.name)
    ? []
    : app.dependencies;

  return {
    ...app,
    dependencies: uniq(
      dependencies.concat(getDependencies(app.name, app.version))
    ),
  };
};
