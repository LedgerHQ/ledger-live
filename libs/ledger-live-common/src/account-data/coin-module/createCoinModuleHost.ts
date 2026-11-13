import { AccountDataNotServedError } from "@domain/api-account-data";
import type {
  CoinModuleBalanceApi,
  CoinModuleAccountStatus,
  CoinModuleAccountStatusApi,
  CoinModuleHost,
} from "@features/platform-account-source-coin-module";
import { getCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import {
  isNotSupportedStub,
  withDefaults,
  withLogging,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { log } from "@ledgerhq/logs";
import { getEnv } from "@shared/env";
import {
  DEFAULT_PAGE_SIZE_BY_FAMILY,
  resolveOperationHistoryBound,
} from "../../bridge/generic-coin-framework/operationHistoryBound";
import { getCurrencyConfiguration } from "../../config";
import {
  hasLocalApi,
  loadBridgeApiForFamily,
  loadLocalApiForFamily,
} from "../../coin-modules/registry";
import { addressFromKey } from "../../account/accountDescriptor";

// A currency with no configuration (MultiversX is configured as `multiversx`, not `elrond`) is left to the next source.
function configurationOf(currencyId: string): Promise<CurrencyConfig> {
  try {
    return Promise.resolve(getCurrencyConfiguration(currencyId));
  } catch (error) {
    return Promise.reject(
      new AccountDataNotServedError(`No configuration for the ${currencyId} coin module`, {
        cause: error,
      }),
    );
  }
}

const contextOf = (currencyId: string): Context<CurrencyConfig> => ({
  config: (id?: string) => configurationOf(id ?? currencyId),
  logger: (type, message, data) =>
    log(String(type), message === undefined ? undefined : String(message), data),
});

async function loadBridgeApi(currency: CryptoCurrency): Promise<BridgeApi> {
  const bridgeApi = await loadBridgeApiForFamily(currency.family);
  return typeof bridgeApi === "function" ? bridgeApi(currency) : (bridgeApi ?? {});
}

async function loadApis(currency: CryptoCurrency) {
  const [createLocalApi, bridgeApi] = await Promise.all([
    loadLocalApiForFamily(currency.family),
    loadBridgeApi(currency),
  ]);
  if (!createLocalApi) throw new Error(`No local coin module api for ${currency.id}`);
  return { createLocalApi, bridgeApi };
}

// Absent without a resolver, so the source falls through on a listed token instead of dropping it.
const tokenIdOf = ({ getTokenFromAsset }: BridgeApi): CoinModuleBalanceApi["getTokenId"] =>
  getTokenFromAsset ? async asset => (await getTokenFromAsset(asset))?.id : undefined;

/** The page size the generic bridge sends the currency's coin module, `undefined` when the module takes no `limit`. */
function pageSizeOf({ id, family }: CryptoCurrency): number | undefined {
  const familyPageSize = DEFAULT_PAGE_SIZE_BY_FAMILY[family];
  if (familyPageSize === undefined) return undefined;
  return resolveOperationHistoryBound(id, family).pageSize ?? familyPageSize;
}

type AccountStatusCapability = {
  getAccountStatus(
    context: Context<CurrencyConfig>,
    key: string,
    options?: { blacklistedTokenIds?: readonly string[] },
  ): Promise<CoinModuleAccountStatus>;
};

const hasAccountStatus = (api: object): api is AccountStatusCapability =>
  "getAccountStatus" in api && typeof api.getAccountStatus === "function";

async function loadAccountStatusApi(
  currencyId: string,
  blacklistedTokenIds: CoinModuleHost["blacklistedTokenIds"],
): Promise<CoinModuleAccountStatusApi | undefined> {
  const currency = getCryptoCurrencyById(currencyId);
  const createLocalApi = await loadLocalApiForFamily(currency.family);
  const localApi: object | undefined = createLocalApi?.(currency.id);
  if (!localApi || !hasAccountStatus(localApi)) return undefined;
  const context = contextOf(currency.id);
  // A blacklisted token makes no token account, so it never makes the account used (TON).
  return {
    // The read's signal rides on the context (coin-modules ADR-071), so a module stops its calls on abort.
    getAccountStatus: (key, signal) =>
      localApi.getAccountStatus(signal ? { ...context, signal } : context, key, {
        blacklistedTokenIds: blacklistedTokenIds?.(),
      }),
  };
}

export type CoinModuleHostOptions = Pick<CoinModuleHost, "blacklistedTokenIds"> & {
  /** Off until the source lists pending operations: FullSync answers the operations meanwhile. */
  servesOperations?: boolean;
};

/** The local coin modules the app registered, read from the registry with no generic-coin-framework layer. No coin module reads a utxo account from its xpub yet, so none is served. */
export function createCoinModuleHost({
  servesOperations = false,
  ...options
}: CoinModuleHostOptions = {}): CoinModuleHost {
  // Built once per currency: every accountStatus read asks it, most to fall through to FullSync.
  const accountStatusApis = new Map<string, Promise<CoinModuleAccountStatusApi | undefined>>();
  return {
    ...options,
    isCurrencySupported(currencyId) {
      // Mock accounts keep their simulated balances: only FullSync routes them to the mock bridges.
      if (getEnv("MOCK")) return false;
      try {
        return hasLocalApi(getCryptoCurrencyById(currencyId));
      } catch {
        return false;
      }
    },
    addressOf: addressFromKey,
    async getApi(currencyId) {
      const currency = getCryptoCurrencyById(currencyId);
      const { createLocalApi, bridgeApi } = await loadApis(currency);
      // Staked and locked funds sit in staking positions, not in the native balance: only FullSync totals them.
      if (bridgeApi.usesStakingPositions) return undefined;
      const localApi = createLocalApi(currency.id);
      if (localApi.getBalance === undefined || isNotSupportedStub(localApi.getBalance)) {
        return undefined;
      }
      const api = withLogging(withDefaults(localApi));
      const context = contextOf(currency.id);
      return {
        // Only a family declaring `balanceOptions` accepts them: some reject any options, `{}` included.
        getBalance: subject => api.getBalance(context, subject, bridgeApi.balanceOptions),
        getTokenId: tokenIdOf(bridgeApi),
        partitionsNativeBalance: bridgeApi.partitionsNativeBalance,
      };
    },
    // Without a `limit`, a coin module may answer the whole history in one page. Decided in the code, not the
    // remote config, so a config change never drops a list mid-way: the remote value only tunes the page size.
    paginatesOperations(currencyId) {
      if (!servesOperations) return false;
      try {
        return DEFAULT_PAGE_SIZE_BY_FAMILY[getCryptoCurrencyById(currencyId).family] !== undefined;
      } catch {
        return false;
      }
    },
    // `getAccountStatus` is a proposal (coin-modules ADR-079): read only from a module that has it.
    getAccountStatusApi(currencyId) {
      let api = accountStatusApis.get(currencyId);
      if (!api) {
        // A failed load is not kept, so the next read retries it.
        api = loadAccountStatusApi(currencyId, options.blacklistedTokenIds).catch(
          (error: unknown) => {
            accountStatusApis.delete(currencyId);
            throw error;
          },
        );
        accountStatusApis.set(currencyId, api);
      }
      return api;
    },
    async getOperationsApi(currencyId) {
      const currency = getCryptoCurrencyById(currencyId);
      const pageSize = pageSizeOf(currency);
      if (pageSize === undefined) return undefined;
      const { createLocalApi, bridgeApi } = await loadApis(currency);
      const localApi = createLocalApi(currency.id);
      if (localApi.listOperations === undefined || isNotSupportedStub(localApi.listOperations)) {
        return undefined;
      }
      const api = withLogging(withDefaults(localApi));
      const context = contextOf(currency.id);
      return {
        listOperations: (subject, { cursor, limit = pageSize }) =>
          api.listOperations(context, subject, {
            minHeight: 0,
            cursor,
            order: "desc",
            // The module raises above what it can serve: the family's page size is the most it is sent.
            limit: Math.min(limit, pageSize),
          }),
        getTokenId: tokenIdOf(bridgeApi),
      };
    },
  };
}
