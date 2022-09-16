// polyfill the unfinished support of apps logic
import uniq from "lodash/uniq";
import {
  listCryptoCurrencies,
  findCryptoCurrencyById,
  getCryptoCurrencyById,
} from "@ledgerhq/cryptoassets";
import { App, Application } from "@ledgerhq/types-live";
const directDep = {};
const reverseDep = {};
export function declareDep(name: string, dep: string) {
  directDep[name] = (directDep[name] || []).concat(dep);
  reverseDep[dep] = (reverseDep[dep] || []).concat(name);
}
listCryptoCurrencies(true, true).forEach((a) => {
  if (!a.managerAppName) return; // no app for this currency

  const dep = findCryptoCurrencyById(a.family);
  if (!dep || !dep.managerAppName) return; // no dep

  if (dep.managerAppName === a.managerAppName) return; // same app

  declareDep(a.managerAppName, dep.managerAppName);

  if (!a.isTestnetFor) {
    declareDep(a.managerAppName + " Test", dep.managerAppName);
  }
});
// whitelist dependencies
export const whitelistDependencies = ["Decred", "Decred Testnet"];

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
].forEach(([name, dep]) => declareDep(name, dep));

export const getDependencies = (appName: string): string[] =>
  directDep[appName] || [];

export const getDependents = (appName: string): string[] =>
  reverseDep[appName] || [];

const forceAppToCurrencyMapping = {
  Ethereum: "ethereum",
};

export const polyfillApplication = (app: Application): Application => {
  let crypto;
  if (app.name in forceAppToCurrencyMapping) {
    // as many currency uses Ethereum app, we force 'ethereum' to be the default currency
    crypto = getCryptoCurrencyById(forceAppToCurrencyMapping[app.name]);
  } else {
    // as a fallback, we try to infer a 1:1 main relationship by looking at the first managerAppName that matches
    // in future, backend needs to tell what is the "main currency id" to consider
    // context: https://ledgerhq.atlassian.net/browse/BACK-390
    crypto = listCryptoCurrencies(true, true).find(
      (crypto) => app.name.toLowerCase() === crypto.managerAppName.toLowerCase()
    );
  }
  let o = app;

  if (crypto && !app.currencyId) {
    o = { ...o, currencyId: crypto.id };
  }

  return o;
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
