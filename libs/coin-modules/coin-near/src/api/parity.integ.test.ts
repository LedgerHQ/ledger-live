import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { BigNumber } from "bignumber.js";
import { setCoinConfig } from "../config";
import getEstimatedFees from "../getFeesForTransaction";
import { getAccount } from "../network";
import { getActionCosts } from "../network/protocolConfig";
import { preload } from "../preload";
import { setNearPreloadData } from "../preload-data";
import type { Transaction } from "../types";
import { createApi } from "./index";

/**
 * The CoinModuleApi and the account bridge must agree on mainnet.
 *
 * They read the same chain through different plumbing: the bridge takes its costs from preloaded
 * data, the api from the protocol config. This suite pins the two together so a change to either
 * side cannot silently drift, which is the main risk of running both paths side by side.
 */
const NODE = "https://near.coin.ledger.com/node";

const infra = {
  API_NEAR_PRIVATE_NODE: NODE,
  API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.near.org",
  API_NEAR_INDEXER: "https://near.coin.ledger.com/indexer",
  API_NEARBLOCKS_INDEXER: "https://near-indexer.coin.ledger.com",
};

const config = () => ({ status: { type: "active" as const }, infra });

const ACCOUNT = "nearkat.near";
const NAMED_RECIPIENT = "recipient.near";
const IMPLICIT_RECIPIENT = "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d";
const POOL = "astro-stakers.poolv1.near";
const AMOUNT = 1_000_000_000_000_000_000_000n;

const sendIntent = (recipient: string): TransactionIntent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: ACCOUNT,
    recipient,
    amount: AMOUNT,
    asset: { type: "native" },
  }) as TransactionIntent;

const bridgeTransaction = (mode: string, recipient: string): Transaction =>
  ({
    family: "near",
    mode,
    recipient,
    amount: new BigNumber(AMOUNT.toString()),
    useAllAmount: false,
  }) as Transaction;

describe("CoinModuleApi vs account bridge (integration)", () => {
  const api = createApi(config, "near");

  beforeAll(async () => {
    setCoinConfig(config);
    // The bridge path only has costs once preloaded; the api path must not need this.
    setNearPreloadData(await preload());
  }, 120_000);

  beforeEach(() => getActionCosts.reset());

  it("reports the same spendable balance", async () => {
    const [native] = await api.getBalance(ACCOUNT);
    const { spendableBalance } = await getAccount(ACCOUNT);

    expect(native.value - (native.locked ?? 0n)).toBe(BigInt(spendableBalance.toFixed(0)));
  }, 120_000);

  it("reports the same total as the native balance, staking buckets included", async () => {
    const [native] = await api.getBalance(ACCOUNT);
    const { balance, nearResources } = await getAccount(ACCOUNT);

    const frozen = nearResources.stakedBalance
      .plus(nearResources.availableBalance)
      .plus(nearResources.pendingBalance)
      .plus(nearResources.storageUsageBalance);

    expect(native.value).toBe(BigInt(balance.toFixed(0)));
    expect(native.locked).toBe(BigInt(BigNumber.min(frozen, balance).toFixed(0)));
  }, 120_000);

  it.each([
    ["a named recipient", NAMED_RECIPIENT],
    ["an implicit recipient", IMPLICIT_RECIPIENT],
  ])(
    "prices a transfer to %s identically",
    async (_label, recipient) => {
      const fromApi = await api.estimateFees(sendIntent(recipient));
      const fromBridge = await getEstimatedFees(bridgeTransaction("send", recipient));

      expect(fromApi.value).toBe(BigInt(fromBridge.toFixed(0)));
      expect(fromApi.value).toBeGreaterThan(0n);
    },
    120_000,
  );

  it.each(["stake", "unstake", "withdraw"])(
    "prices a %s identically",
    async mode => {
      const stakingIntent = {
        ...sendIntent(POOL),
        intentType: "staking" as const,
        type: mode === "stake" ? "delegate" : mode === "unstake" ? "undelegate" : "withdraw",
        mode: mode === "stake" ? "delegate" : mode === "unstake" ? "undelegate" : "withdraw",
        valAddress: POOL,
      };

      const fromApi = await api.estimateFees(stakingIntent as never);
      const fromBridge = await getEstimatedFees(bridgeTransaction(mode, POOL));

      expect(fromApi.value).toBe(BigInt(fromBridge.toFixed(0)));
      expect(fromApi.value).toBeGreaterThan(0n);
    },
    120_000,
  );

  it("charges the higher gas for a withdraw-all on both paths", async () => {
    const intent = {
      ...sendIntent(POOL),
      intentType: "staking" as const,
      type: "withdraw",
      mode: "withdraw",
      valAddress: POOL,
      useAllAmount: true,
    };

    const fromApi = await api.estimateFees(intent as never);
    const fromBridge = await getEstimatedFees({
      ...bridgeTransaction("withdraw", POOL),
      useAllAmount: true,
    } as Transaction);
    const partial = await api.estimateFees({ ...intent, useAllAmount: false } as never);

    expect(fromApi.value).toBe(BigInt(fromBridge.toFixed(0)));
    expect(fromApi.value).toBeGreaterThan(partial.value);
  }, 120_000);

  it("prices without preloaded data, which the bridge path cannot do", async () => {
    // Wipe what preload() filled in: the bridge would now price at zero, the api must not.
    setNearPreloadData({
      storageCost: new BigNumber(0),
      gasPrice: new BigNumber(0),
      createAccountCostSend: new BigNumber(0),
      createAccountCostExecution: new BigNumber(0),
      transferCostSend: new BigNumber(0),
      transferCostExecution: new BigNumber(0),
      addKeyCostSend: new BigNumber(0),
      addKeyCostExecution: new BigNumber(0),
      receiptCreationSend: new BigNumber(0),
      receiptCreationExecution: new BigNumber(0),
      validators: [],
    });

    const fromApi = await api.estimateFees(sendIntent(NAMED_RECIPIENT));
    const fromBridge = await getEstimatedFees(bridgeTransaction("send", NAMED_RECIPIENT));

    expect(fromApi.value).toBeGreaterThan(0n);
    expect(fromBridge.isZero()).toBe(true);

    setNearPreloadData(await preload());
  }, 120_000);
});
