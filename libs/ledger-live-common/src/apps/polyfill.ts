// polyfill the unfinished support of apps logic
import uniq from "lodash/uniq";
import {
  listCryptoCurrencies,
  findCryptoCurrencyById,
} from "@ledgerhq/cryptoassets";
import { App, Application } from "@ledgerhq/types-live";
const directDep = {};
const reverseDep = {};
// TODO remove newBitcoinApp logic after 2.1.0 bitcoin nano app
let newBitcoinApp = false;

// whitelist dependencies
export const whitelistDependencies = [
  "Decred",
  "Decred Test",
  "Bitcoin",
  "Bitcoin Test",
  "Zcash",
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
  ["ARTIS sigma1", "Ethereum"],
  ["EnergyWebChain", "Ethereum"],
  ["kUSD", "Ethereum"],
  ["LBRY", "Bitcoin"],
  ["Ravencoin", "Bitcoin"],
  ["Resistance", "Bitcoin"],
  ["RSK Test", "Ethereum"],
  ["RSK", "Ethereum"],
  ["ThunderCore", "Ethereum"],
  ["Volta", "Ethereum"],
  ["ZenCash", "Bitcoin"],
  ["Paraswap", "Ethereum"],
  ["Lido", "Ethereum"],
  ["1inch", "Ethereum"],
  ["Aave", "Ethereum"],
  ["Compound", "Ethereum"],
  ["Opensea", "Ethereum"],
  ["StakeDAO", "Ethereum"],
  ["Yearn", "Ethereum"],
  ["RocketPool", "Ethereum"],
  ["POAP", "Ethereum"],
  ["OlympusDAO", "Ethereum"],
  ["Rarible", "Ethereum"],
  ["Ricochet", "Ethereum"],
  ["Kiln", "Ethereum"],
  ["Alkemi", "Ethereum"],
  ["[ L ] Market", "Ethereum"],
  ["cBridge", "Ethereum"],
  ["Euler", "Ethereum"],
  ["Staderlabs", "Ethereum"],
].forEach(([name, dep]) => declareDep(name, dep));
export const getDependencies = (appName: string): string[] =>
  directDep[appName] || [];
export const getDependents = (appName: string): string[] =>
  reverseDep[appName] || [];
export const polyfillApplication = (
  app: Application,
  provider: number
): Application => {
  const crypto = listCryptoCurrencies(true, true).find(
    (crypto) =>
      app.name.toLowerCase() === crypto.managerAppName.toLowerCase() &&
      (crypto.managerAppName !== "Ethereum" ||
        // if it's ethereum, we have a specific case that we must only allow the Ethereum app
        app.name === "Ethereum")
  );
  if (app.name === "Bitcoin Legacy") {
    app.application_versions.forEach((version) => {
      if (version.providers.includes(provider)) {
        newBitcoinApp = true;
      }
    });
  }
  let o = app;

  if (crypto && !app.currencyId) {
    o = { ...o, currencyId: crypto.id };
  }

  return o;
};

export const calculateDependencies = (): void => {
  listCryptoCurrencies(true, true).forEach((a) => {
    if (!a.managerAppName) return; // no app for this currency

    const dep = findCryptoCurrencyById(a.family);
    if (!dep || !dep.managerAppName) return; // no dep

    if (dep.managerAppName === a.managerAppName) return; // same app
    if (a.family === "bitcoin" && newBitcoinApp) {
      // all altcoin in bitcoin family currencies depend on bitcoin legacy app since nano app 2.1.0
      declareDep(a.managerAppName, "Bitcoin Legacy");
      return;
    }
    declareDep(a.managerAppName, dep.managerAppName);
    if (!a.isTestnetFor) {
      declareDep(a.managerAppName + " Test", dep.managerAppName);
    }
  });
};

export const polyfillApp = (app: App): App => {
  const dependencies = whitelistDependencies.includes(app.name)
    ? []
    : app.dependencies;

  return {
    ...app,
    dependencies: uniq(dependencies.concat(getDependencies(app.name))),
  };
};
