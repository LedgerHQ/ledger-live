import { getEnv } from "@ledgerhq/live-env";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { flow, isArray, isEqual, isObject, isUndefined, mapValues, omitBy } from "lodash/fp";
import { getMockedMethods } from "./mock-data";
import { sync } from "../../../bridge/mockHelpers";
import { createBridges } from "@ledgerhq/coin-canton/bridge/index";
import { createApi } from "@ledgerhq/coin-canton/api/index";
import { CreateSigner, executeWithSigner } from "../../../bridge/setup";
import Transport from "@ledgerhq/hw-transport";
import { CantonSigner } from "@ledgerhq/coin-canton";
import { LegacySignerCanton } from "@ledgerhq/live-signer-canton";
import { CantonCoinConfig, CantonConfig } from "@ledgerhq/coin-canton/config";
import { getCurrencyConfiguration } from "../../../config";
import { getCryptoCurrencyById } from "../../../currencies";
import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";

import { delay } from "../../../promise";
import { genAccount } from "../../../mock/account";
import type { ScanAccountEvent } from "@ledgerhq/types-live";

const LOG_PREFIX = "[canton-mock]";
const debugLog = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.log(LOG_PREFIX, ...args);
};

// Mock API that returns predefined responses
function mockCantonAPI() {
  const mockedMethods = getMockedMethods();

  const api = new Proxy(
    {},
    {
      get(_, propKey) {
        if (propKey === "then") {
          return undefined;
        }

        const method = propKey.toString();
        debugLog("api access", { method });
        const mocks = mockedMethods.filter(mock => mock.method === method);

        if (mocks.length === 0) {
          const message = `no mock found for api method: ${method}`;
          debugLog("api error", { message });
          throw new Error(message);
        }

        return function (...rawArgs: unknown[]) {
          const args = preprocessArgs(method, rawArgs);
          debugLog("api call", { method, args });
          const mock = mocks.find(({ params: mockArgs }) => isEqual(args)(mockArgs));

          if (mock === undefined) {
            const argsJson = JSON.stringify(args);
            const message = `no mock found for api method ${method} with args ${argsJson}`;
            debugLog("api error", { message });
            throw new Error(message);
          }

          debugLog("api return", { method, answerPreview: typeof mock.answer });
          return Promise.resolve(mock.answer);
        };
      },
    },
  );

  return api;
}

function removeUndefineds(input: unknown): unknown {
  return isObject(input) && !isArray(input)
    ? flow(omitBy(isUndefined), mapValues(removeUndefineds))(input)
    : input;
}

function preprocessArgs(method: string, rawArgs: unknown[]): unknown[] {
  return rawArgs.map(removeUndefineds);
}

// The calls data can be copied to mock-data.ts from the file.
// This function creates a live API with logging for generating mock data
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function createMockDataForAPI() {
  const createSigner: CreateSigner<CantonSigner> = (transport: Transport) => {
    return new LegacySignerCanton(transport);
  };

  const signerContext = executeWithSigner(createSigner);

  const apiGetter = makeLRUCache(
    (config: CantonConfig) => Promise.resolve(createApi(config)),
    config => config.nodeUrl || "",
    minutes(1000),
  );

  return {
    getAPI: apiGetter,
    getQueuedAPI: apiGetter,
    getQueuedAndCachedAPI: apiGetter,
    signerContext,
  };
}

function getMockedAPIs() {
  const createSigner: CreateSigner<CantonSigner> = (transport: Transport) => {
    const signer = new LegacySignerCanton(transport);
    debugLog("createSigner: LegacySignerCanton", signer);
    return signer;
  };

  const getCurrencyConfig = () => {
    // Use devnet for development/testing
    const config = getCurrencyConfiguration<CantonCoinConfig>(
      getCryptoCurrencyById("canton_network_devnet"),
    );
    debugLog("getCurrencyConfig created", config);
    return config;
  };

  const signerContext = executeWithSigner(createSigner);
  debugLog("signerContext created", signerContext);

  return {
    api: mockCantonAPI(),
    signerContext,
    getCurrencyConfig,
  };
}

debugLog("creating bridges with mockedAPIs");
const mockedAPIs = getMockedAPIs();
const bridges = createBridges(mockedAPIs.signerContext, mockedAPIs.getCurrencyConfig);

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- expected for development
const extendedCurrencyBridge = bridges.currencyBridge as typeof bridges.currencyBridge & {
  isAccountDeployed: (publicKey: string) => Promise<boolean>;
  deployAccount: (deviceId: string, publicKey: string) => Promise<any>;
  getAccountDeploymentStatus: (publicKey: string) => Promise<any>;
};

debugLog("bridges created", {
  currencyBridgeMethods: Object.keys(bridges.currencyBridge || {}),
  accountBridgeMethods: Object.keys(bridges.accountBridge || {}),
});

function cantonScanAccounts({ currency }): Observable<ScanAccountEvent> {
  return new Observable<ScanAccountEvent>(observer => {
    let unsubscribed = false;

    const scanJob = async () => {
      debugLog("Canton scanAccounts starting", { currency: currency?.id });

      // Check for existing deployed accounts first
      const testPublicKeys = []; // Empty for now - no existing accounts
      let accountsFound = 0;

      for (const publicKey of testPublicKeys) {
        if (unsubscribed) break;

        try {
          const isDeployed = await extendedCurrencyBridge.isAccountDeployed(publicKey);
          debugLog("Canton deployment check", {
            publicKey: publicKey,
            isDeployed,
          });

          if (isDeployed) {
            // Note: This section would create deployed accounts if any existed
            // For now, Canton has no existing accounts so this won't execute
            debugLog("Canton deployed account would be created here");
            accountsFound++;
            await delay(500);
          }
        } catch (error) {
          debugLog("Canton deployment check failed", { error });
        }
      }

      // Generate accounts following the exact standard mock pattern
      const nbAccountToGen = 3;

      for (let i = 0; i < nbAccountToGen; i++) {
        if (unsubscribed) break;

        const isLast = i === 2;
        await delay(300);

        const account = genAccount(`MOCK_CANTON_${currency.id}_${i}`, {
          operationsSize: isLast ? 0 : 100,
          currency,
          subAccountsCount: isLast ? 0 : undefined,
          bandwidth: !isLast,
        });

        account.index = i;
        account.operations = isLast
          ? []
          : account.operations.map(operation => ({
              ...operation,
              date: new Date(
                new Date(operation.date).setFullYear(new Date(operation.date).getFullYear() - 1),
              ),
            }));
        account.used = isLast ? false : account.used;

        if (isLast) {
          account.spendableBalance = account.balance = new BigNumber(0);
        }

        debugLog("Canton account generated", {
          id: account.id,
          index: i,
          used: account.used,
          balance: account.balance.toString(),
          operationsCount: account.operations.length,
        });

        observer.next({ type: "discovered", account });
      }

      debugLog(`Canton scan complete: ${accountsFound} deployed, ${nbAccountToGen} generated`);
      observer.complete();
    };

    scanJob();
    return () => {
      unsubscribed = true;
    };
  });
}

const usingTestEnv = getEnv("MOCK");
debugLog("exporting bridges", { usingTestEnv });

export default usingTestEnv
  ? {
      accountBridge: {
        ...bridges.accountBridge,
        sync: (...args: unknown[]) => {
          debugLog("accountBridge.sync called", { args });
          // @ts-expect-error: preserve original signature at runtime
          return sync(...args);
        },
      },
      currencyBridge: {
        ...bridges.currencyBridge,
        isAccountDeployed: extendedCurrencyBridge.isAccountDeployed,
        deployAccount: extendedCurrencyBridge.deployAccount,
        getAccountDeploymentStatus: extendedCurrencyBridge.getAccountDeploymentStatus,
        preload: (...args: unknown[]) => {
          debugLog("currencyBridge.preload called", { args });
          const result = Promise.resolve({});
          result
            .then(() => {
              debugLog("currencyBridge.preload resolved");
            })
            .catch(error => {
              debugLog("currencyBridge.preload error", { error });
            });
          return result;
        },
        hydrate: (...args: unknown[]) => {
          debugLog("currencyBridge.hydrate called", { args });
        },
        scanAccounts: (...args: unknown[]) => {
          debugLog("currencyBridge.scanAccounts called", { args });
          try {
            const [scanRequest] = args;
            const result = cantonScanAccounts(scanRequest as any);
            debugLog("currencyBridge.scanAccounts result type", {
              resultType: typeof result,
              isObservable: result && typeof result.subscribe === "function",
            });
            return result;
          } catch (error) {
            debugLog("currencyBridge.scanAccounts error", { error });
            throw error;
          }
        },
      },
    }
  : bridges;
