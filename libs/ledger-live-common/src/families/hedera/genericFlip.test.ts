import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isGenericCoinFrameworkFamily } from "../../bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import { getCoinFrameworkAccountBridge } from "../../bridge/generic-coin-framework/accountBridge";
import { getCoinFrameworkCurrencyBridge } from "../../bridge/generic-coin-framework/currencyBridge";
import { getBridgeApi } from "../../bridge/generic-coin-framework/bridge";
import { createTransaction } from "../../bridge/generic-coin-framework/createTransaction";
import { transactionToIntent } from "../../bridge/generic-coin-framework/utils";
import type { GenericTransaction } from "../../bridge/generic-coin-framework/types";

/**
 * LIVE-36154 — the flag flip. Everything below only resolves once all four missing loader hooks
 * (rounds 1-4), the `buildIterateResult` pass-through (round 3), the family-local transaction and
 * device config (round 6) and this round's default-transaction case are all wired at once — this is
 * the one test that would fail if any earlier round's registration were missing or mistyped.
 */
describe("hedera on the generic coin framework (the flip)", () => {
  it("is enabled in the family flag list", () => {
    expect(isGenericCoinFrameworkFamily("hedera")).toBe(true);
  });

  it("builds a full account bridge without throwing", async () => {
    const bridge = await getCoinFrameworkAccountBridge("hedera", "local");

    expect(bridge.sync).toBeInstanceOf(Function);
    expect(bridge.createTransaction).toBeInstanceOf(Function);
    expect(bridge.signOperation).toBeInstanceOf(Function);
    expect(bridge.receive).toBeInstanceOf(Function);
    // Round 4's hooks reached the resolved bridge.
    expect(bridge.assignFromAccountRaw).toBeInstanceOf(Function);
    expect(bridge.assignToAccountRaw).toBeInstanceOf(Function);
  });

  it("builds a currency bridge with hedera's mirror-node account discovery, given a currency", async () => {
    const bridge = await getCoinFrameworkCurrencyBridge(
      "hedera",
      "local",
      undefined,
      getCryptoCurrencyById("hedera"),
    );

    expect(bridge.scanAccounts).toBeInstanceOf(Function);
  });

  it("creates a signable default transaction with a zero nonce, so getNextSequence is never reached", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("hedera"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "hedera",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
      nonce: new BigNumber(0),
    });
  });

  it.each(["redelegate", "claimReward"])(
    "does not throw building the intent for a %s transaction — the default mode allowlist rejects both, hedera's own computeIntentType (Round 8) is required",
    async mode => {
      const currency = getCryptoCurrencyById("hedera");
      const account = {
        freshAddress: "0.0.1111111",
        xpub: "",
        currency,
        subAccounts: [],
      } as unknown as Account;
      const transaction: GenericTransaction = {
        family: "hedera",
        mode: mode as GenericTransaction["mode"],
        amount: new BigNumber(0),
        recipient: "",
        valId: "1",
      };
      const bridgeApi = await getBridgeApi(currency, "hedera");

      expect(() =>
        transactionToIntent(account, transaction, bridgeApi.computeIntentType),
      ).not.toThrow();
    },
  );

  it(
    "routes a changeTrust (association) transaction to the legacy token-associate intent type — " +
      "without this, craftTransaction/mapIntentToSDKOperation's exact-string dispatch would silently " +
      "fall through to a plain coin transfer instead of an association",
    async () => {
      const currency = getCryptoCurrencyById("hedera");
      const account = {
        freshAddress: "0.0.1111111",
        xpub: "",
        currency,
        subAccounts: [],
      } as unknown as Account;
      const transaction: GenericTransaction = {
        family: "hedera",
        mode: "changeTrust",
        amount: new BigNumber(0),
        recipient: "",
        assetReference: "0.0.999999",
        assetOwner: "0.0.1111111",
      };
      const bridgeApi = await getBridgeApi(currency, "hedera");

      const intent = transactionToIntent(account, transaction, bridgeApi.computeIntentType);

      expect(intent.type).toBe("token-associate");
    },
  );

  it(
    "carries a delegate transaction's valId into intent.data.stakingNodeId — without " +
      "hedera's buildIntentData, craftTransaction's staking branch reads intent.data (never " +
      "intent.valId directly) and would neither set nor clear the account's staked node",
    async () => {
      const currency = getCryptoCurrencyById("hedera");
      const account = {
        freshAddress: "0.0.1111111",
        xpub: "",
        currency,
        subAccounts: [],
      } as unknown as Account;
      const transaction: GenericTransaction = {
        family: "hedera",
        mode: "delegate",
        amount: new BigNumber(0),
        recipient: "",
        valId: "3",
      };
      const bridgeApi = await getBridgeApi(currency, "hedera");

      const intent = transactionToIntent(
        account,
        transaction,
        bridgeApi.computeIntentType,
        undefined,
        bridgeApi.buildIntentData,
      );

      expect(intent.data).toEqual({ type: "staking", stakingNodeId: 3 });
    },
  );
});
