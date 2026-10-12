/**
 * @jest-environment jsdom
 */
import "./setup"; // side-effect: triggers cosmosCoinConfig.setCoinConfig, required by cryptoFactory
import invariant from "invariant";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { getCurrentCosmosPreloadData } from "@ledgerhq/coin-cosmos/preloadedData";
import preloadedMockData from "@ledgerhq/coin-cosmos/preloadedData.mock";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setEnv } from "@shared/env";
import { CurrencyBridge } from "@ledgerhq/types-live";
import { act, renderHook } from "@testing-library/react";
import "../../__tests__/test-helpers/dom-polyfill";
import { getAccountCurrency } from "../../account";
import { getAccountBridge, getCurrencyBridge } from "../../bridge";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { liveConfig } from "../../config/sharedConfig";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genAddingOperationsInAccount } from "../../mock/account";
import * as hooks from "./react";
import type { StakingAccount } from "@ledgerhq/types-live";
import type {
  CosmosAccount,
  CosmosDelegation,
  CosmosMappedDelegation,
  CosmosValidatorItem,
  Transaction,
} from "./types";

const localCache = {};
const cache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },

  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});

describe("cosmos/react", () => {
  beforeAll(() => {
    LiveConfig.setConfig(liveConfig);
    const cosmos = cryptoFactory("cosmos");
    cosmos.lcd = LiveConfig.getValueByKey("config_currency_cosmos").lcd;
    cosmos.minGasPrice = LiveConfig.getValueByKey("config_currency_cosmos").minGasPrice;
    cosmos.ledgerValidator = LiveConfig.getValueByKey("config_currency_cosmos").ledgerValidator;
  });

  describe("useCosmosFamilyPreloadData", () => {
    it("should return Cosmos preload data and updates", async () => {
      const { prepare } = await setup();
      await act(() => prepare());
      const { result } = renderHook(() => hooks.useCosmosFamilyPreloadData("cosmos"));
      const data = getCurrentCosmosPreloadData()["cosmos"];
      expect(result.current).toStrictEqual(data);
      expect(result.current).toStrictEqual(preloadedMockData);
    });
  });

  describe("useCosmosFormattedDelegations", () => {
    it("should return formatted delegations", async () => {
      const { account, prepare } = await setup();
      await prepare();
      const { result } = renderHook(() => hooks.useCosmosFamilyMappedDelegations(account));
      const delegations = account.stakingResources.delegations;
      invariant(delegations, "cosmos: delegations is required");
      expect(account.stakingResources.delegations.some(d => d.amount[0] === 0)).toBe(false);
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current.length).toBe((delegations as CosmosDelegation[]).length);
      const { code } = getAccountCurrency(account).units[0];
      expect(result.current[0].formattedAmount.split(" ")[1]).toBe(code);
      expect(result.current[0].formattedPendingRewards.split(" ")[1]).toBe(code);
      expect(typeof result.current[0].rank).toBe("number");
      expect((result.current[0].validator as CosmosValidatorItem).validatorAddress).toBe(
        (delegations as CosmosDelegation[])[0].validatorAddress,
      );
    });

    it("should throw for an account without staking resources", async () => {
      const { account } = await setup();
      const { stakingResources: _stakingResources, ...nonStakingAccount } = account;
      expect(() =>
        renderHook(() =>
          hooks.useCosmosFamilyMappedDelegations(nonStakingAccount as CosmosAccount),
        ),
      ).toThrow("cosmos staking account required");
    });

    it("should return an empty list when there are no delegations instead of throwing", async () => {
      const { account, prepare } = await setup();
      await prepare();
      const accountWithoutDelegations: CosmosAccount & StakingAccount = {
        ...account,
        stakingResources: { ...account.stakingResources, delegations: [] },
      };
      const { result } = renderHook(() =>
        hooks.useCosmosFamilyMappedDelegations(accountWithoutDelegations),
      );
      expect(result.current).toEqual([]);
    });

    describe("mode: claimReward", () => {
      it("should only return delegations which have some pending rewards", async () => {
        const { account, prepare } = await setup();
        await prepare();
        const { result } = renderHook(() =>
          hooks.useCosmosFamilyMappedDelegations(account, "claimReward"),
        );
        expect(result.current.length).toBe(3);
      });
    });
  });

  describe("useCosmosFamilyDelegationsQuerySelector", () => {
    it("should return delegations filtered by query as options", async () => {
      const { account, transaction, prepare } = await setup();
      await prepare();
      const { delegations } = account.stakingResources;
      const newTx = {
        ...transaction,
        mode: "delegate",
        valAddress: delegations[0].validatorAddress,
      };
      const { result } = renderHook(() =>
        hooks.useCosmosFamilyDelegationsQuerySelector(account, newTx as Transaction),
      );
      expect(result.current.options.length).toBe(delegations.length);
      act(() => {
        result.current.setQuery("FRESHATOMS");
      });
      expect(result.current.options.length).toBe(0);
    });
    it("should return the first delegation as value", async () => {
      const { account, transaction, prepare } = await setup();
      await prepare();
      const { delegations } = account.stakingResources;
      const newTx = {
        ...transaction,
        mode: "delegate",
        valAddress: delegations[0].validatorAddress,
      };
      const { result } = renderHook(() =>
        hooks.useCosmosFamilyDelegationsQuerySelector(account, newTx as Transaction),
      );
      expect(
        ((result.current.value as CosmosMappedDelegation).validator as CosmosValidatorItem)
          .validatorAddress,
      ).toBe(delegations[0].validatorAddress);
    });
    it("should find delegation by valAddress field and return as value for redelegate", async () => {
      const { account, transaction, prepare } = await setup();
      await prepare();
      const { delegations } = account.stakingResources;
      const sourceValidator = delegations[delegations.length - 1].validatorAddress;
      const newTx = {
        ...transaction,
        mode: "redelegate",
        valAddress: sourceValidator,
        dstValAddress: delegations[0].validatorAddress,
      };
      const { result } = renderHook(() =>
        hooks.useCosmosFamilyDelegationsQuerySelector(account, newTx as Transaction),
      );
      expect(
        ((result.current.value as CosmosMappedDelegation).validator as CosmosValidatorItem)
          .validatorAddress,
      ).toBe(sourceValidator);
    });
  });

  describe("useSortedValidators", () => {
    it("should return sorted validators", async () => {
      const { account, prepare } = await setup();
      await prepare();
      const { result: preloadDataResult } = renderHook(() =>
        hooks.useCosmosFamilyPreloadData("cosmos"),
      );
      const { validators } = preloadDataResult.current;
      const delegations = (account.stakingResources.delegations || []).map(
        ({ validatorAddress, amount }) => ({
          address: validatorAddress,
          amount,
        }),
      );
      const { result } = renderHook(() => hooks.useSortedValidators("", validators, delegations));
      expect(result.current.length).toBe(validators.length);
      const { result: searchResult } = renderHook(() =>
        hooks.useSortedValidators("Nodeasy.com", validators, delegations),
      );
      expect(searchResult.current.length).toBe(1);
    });
  });
  describe("reorderValidators", () => {
    it("should return a list of Validators with Ledger first", async () => {
      const { account } = await setup();
      const { result } = renderHook(() =>
        hooks.useLedgerFirstShuffledValidatorsCosmosFamily("cosmos", account.stakingResources.validators),
      );
      const LEDGER_VALIDATOR_ADDRESS = cryptoFactory("cosmos").ledgerValidator;
      expect(result.current[0].validatorAddress).toBe(LEDGER_VALIDATOR_ADDRESS);
    });
  });
});

async function setup(): Promise<{
  account: CosmosAccount & StakingAccount;
  currencyBridge: CurrencyBridge;
  transaction: Transaction;
  prepare: () => Promise<any>;
}> {
  setEnv("MOCK", "1");
  const seed = "cosmos-2";
  const currency = getCryptoCurrencyById("cosmos");
  const a = genAccount(seed, {
    currency,
  });
  const account = (await genAddingOperationsInAccount(a, 3, seed)) as CosmosAccount &
    StakingAccount;
  account.stakingResources.validators = [
    ...(account.stakingResources.validators ?? []),
    {
      validatorAddress: "cosmosvaloper1qe2s0gguw2khnpfteqy8mhsh5qtmmujfa6fas9",
      name: "Kraken03",
      commission: 0.1,
      tokens: "15924774423713",
      votingPower: 0,
      estimatedYearlyRewardsRate: 0
    },
    {
      validatorAddress: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
      name: "Ledger by Bitwise",
      commission: 0.075,
      tokens: "9751517505298",
      votingPower: 0,
      estimatedYearlyRewardsRate: 0
    },
    {
      validatorAddress: "cosmosvaloper18ruzecmqj9pv8ac0gvkgryuc7u004te9rh7w5s",
      name: "Binance Node",
      commission: 0.05,
      tokens: "9307007776417",
      votingPower: 0,
      estimatedYearlyRewardsRate: 0
    }
  ];
  const currencyBridge = await getCurrencyBridge(currency);
  const bridge = await getAccountBridge(account);
  const transaction = bridge.createTransaction(account);
  return {
    account,
    currencyBridge,
    transaction,
    prepare: async () => cache.prepareCurrency(currency),
  };
}
