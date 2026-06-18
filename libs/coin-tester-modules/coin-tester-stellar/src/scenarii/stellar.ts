import { BigNumber } from "bignumber.js";
import { Config as StellarSdkConfig } from "@stellar/stellar-sdk";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import coinConfig from "@ledgerhq/coin-stellar/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  STELLAR,
  HORIZON_URL,
  RECIPIENT_ADDRESS,
  RECIPIENT_SEED,
  ISSUER_ADDRESS,
  ISSUER_SEED,
  USDC_ASSET_CODE,
  USDC_TOKEN,
  makeAccount,
} from "../fixtures";
import { buildSigner } from "../signer";
import { getBridges } from "../helpers";
import {
  fundViaFriendbot,
  killStellarQuickstart,
  spawnStellarQuickstart,
} from "../stellar-quickstart";
import { createTrustline, sendIssuerPayment } from "../local-tx";
import { initMswHandlers } from "../indexer";

global.console = require("console");
jest.setTimeout(600_000);

let closeMsw: (() => void) | null = null;

type StellarScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

/**
 * Hook flag: ensures we only inject USDC into the test account once,
 * the first time `beforeEach` runs after the trustline has been established.
 * Reset by `teardown` so reusing this module from another test is safe.
 */
let usdcInjected = false;

function findUsdcSubAccount(account: Account): TokenAccount | undefined {
  return account.subAccounts?.find(
    sa => sa.type === "TokenAccount" && sa.token.id === USDC_TOKEN.id,
  ) as TokenAccount | undefined;
}

/**
 * `subAccountId` for the test account's USDC trustline.  Deterministic
 * because both the parent address and the token id are known up-front, so
 * we can wire it into the scenario transactions without waiting for the
 * sub-account to materialise in `subAccounts`.
 */
function makeTokenSubAccountId(testAccountAddress: string): string {
  const parentId = `js:2:stellar:${testAccountAddress}:sep5`;
  return encodeTokenAccountId(parentId, USDC_TOKEN);
}

/**
 * 32-byte (64 hex char) constants used to exercise MEMO_HASH and MEMO_RETURN.
 * Stellar stores these on-chain as 32 raw bytes; Horizon returns them base64-
 * encoded; the coin module's `decodeMemo` converts back to hex — so the
 * round-trip preserves the exact hex string we send.
 */
const MEMO_HASH_HEX = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
const MEMO_RETURN_HEX = "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe";
const MEMO_ID_VALUE = "1234567890";
const MEMO_TEXT_VALUE = "hello stellar";

function makeMemoSend(
  name: string,
  memoType: "MEMO_TEXT" | "MEMO_ID" | "MEMO_HASH" | "MEMO_RETURN",
  memoValue: string,
): StellarScenarioTransaction {
  return {
    name,
    amount: new BigNumber(0.5 * 1e7),
    recipient: RECIPIENT_ADDRESS,
    memoType,
    memoValue,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.recipients).toContain(RECIPIENT_ADDRESS);
      const memo = (latestOperation.extra as { memo?: { type: string; value?: string } })?.memo;
      expect(memo).toEqual({ type: memoType, value: memoValue });
    },
  };
}

function makeScenarioTransactions(address: string): StellarScenarioTransaction[] {
  const tokenSubAccountId = makeTokenSubAccountId(address);

  const sendOneXlm: StellarScenarioTransaction = {
    name: "Send 1 XLM to existing account",
    amount: new BigNumber(1e7),
    recipient: RECIPIENT_ADDRESS,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.recipients).toContain(RECIPIENT_ADDRESS);
      expect(latestOperation.value).toStrictEqual(new BigNumber(1e7).plus(latestOperation.fee));
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const sendWithMemoText = makeMemoSend(
    "Send 0.5 XLM with MEMO_TEXT",
    "MEMO_TEXT",
    MEMO_TEXT_VALUE,
  );
  const sendWithMemoId = makeMemoSend("Send 0.5 XLM with MEMO_ID", "MEMO_ID", MEMO_ID_VALUE);
  const sendWithMemoHash = makeMemoSend("Send 0.5 XLM with MEMO_HASH", "MEMO_HASH", MEMO_HASH_HEX);
  const sendWithMemoReturn = makeMemoSend(
    "Send 0.5 XLM with MEMO_RETURN",
    "MEMO_RETURN",
    MEMO_RETURN_HEX,
  );

  const optInUsdc: StellarScenarioTransaction = {
    name: "Opt in (changeTrust) to USDC",
    mode: "changeTrust",
    assetReference: USDC_ASSET_CODE,
    assetOwner: ISSUER_ADDRESS,
    recipient: ISSUER_ADDRESS,
    amount: new BigNumber(0),
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const subAccount = findUsdcSubAccount(currentAccount);
      expect(subAccount).toBeDefined();
      expect(subAccount?.balance.toString()).toBe("0");
    },
  };

  const sendUsdc: StellarScenarioTransaction = {
    name: "Send 10 USDC to recipient",
    amount: new BigNumber(10 * 1e7),
    recipient: RECIPIENT_ADDRESS,
    subAccountId: tokenSubAccountId,
    assetReference: USDC_ASSET_CODE,
    assetOwner: ISSUER_ADDRESS,
    expect: (previousAccount, currentAccount) => {
      const previousSub = findUsdcSubAccount(previousAccount);
      const currentSub = findUsdcSubAccount(currentAccount);
      expect(previousSub).toBeDefined();
      expect(currentSub).toBeDefined();
      expect(currentSub!.balance).toStrictEqual(previousSub!.balance.minus(10 * 1e7));
      expect(currentSub!.operations.length).toBeGreaterThan(previousSub!.operations.length);
      const [latestSubOp] = currentSub!.operations;
      expect(latestSubOp.type).toBe("OUT");
      expect(latestSubOp.recipients).toContain(RECIPIENT_ADDRESS);
    },
  };

  const sendAllUsdc: StellarScenarioTransaction = {
    name: "Send all USDC to recipient",
    recipient: RECIPIENT_ADDRESS,
    subAccountId: tokenSubAccountId,
    assetReference: USDC_ASSET_CODE,
    assetOwner: ISSUER_ADDRESS,
    useAllAmount: true,
    expect: (previousAccount, currentAccount) => {
      const currentSub = findUsdcSubAccount(currentAccount);
      expect(currentSub).toBeDefined();
      expect(currentSub!.balance.toString()).toBe("0");
      expect(currentSub!.spendableBalance.toString()).toBe("0");
    },
  };

  const sendMaxXlm: StellarScenarioTransaction = {
    name: "Send max XLM",
    useAllAmount: true,
    recipient: RECIPIENT_ADDRESS,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.recipients).toContain(RECIPIENT_ADDRESS);
      expect(currentAccount.spendableBalance.toString()).toBe("0");
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  return [
    sendOneXlm,
    sendWithMemoText,
    sendWithMemoId,
    sendWithMemoHash,
    sendWithMemoReturn,
    optInUsdc,
    sendUsdc,
    sendAllUsdc,
    sendMaxXlm,
  ];
}

export const scenarioStellar: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Stellar — XLM + USDC (local)",

  setup: async () => {
    StellarSdkConfig.setAllowHttp(true);
    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: async (address, currencyId, tokenIdentifier) => {
        if (
          currencyId === "stellar" &&
          address === ISSUER_ADDRESS &&
          tokenIdentifier === USDC_ASSET_CODE
        ) {
          return USDC_TOKEN;
        }
        return undefined;
      },
      findTokenById: async (id: string) => (id === USDC_TOKEN.id ? USDC_TOKEN : undefined),
    });

    await spawnStellarQuickstart();
    usdcInjected = false;

    const stellarSigner = await buildSigner();
    const { currencyBridge, accountBridge, getAddress } = await getBridges(stellarSigner);
    // Configure coin-stellar to talk to the local Horizon. Must happen before
    // any local-tx helper (createTrustline / sendIssuerPayment) runs, because
    // those go through coin-stellar's craft / combine / broadcast pipeline and
    // read the explorer URL from coinConfig.
    const localConfig = {
      status: { type: "active" as const },
      explorer: { url: HORIZON_URL, fetchLimit: 100 },
      useStaticFees: true,
    };
    coinConfig.setCoinConfig(() => localConfig);
    LiveConfig.setConfig({
      config_currency_stellar: {
        type: "object",
        default: localConfig,
      },
    });

    const { address } = await getAddress("", {
      path: "44'/148'/0'",
      currency: STELLAR,
      derivationMode: "sep5",
    });

    // Fund test account, recipient and issuer via friendbot so each exists
    // on-chain before any trustline / payment is attempted.
    await fundViaFriendbot(address);
    await fundViaFriendbot(RECIPIENT_ADDRESS);
    await fundViaFriendbot(ISSUER_ADDRESS);
    // Pre-create the recipient's USDC trustline so the bridge-side payment
    // doesn't fail with op_no_trust. Driven through coin-stellar's own
    // craft/combine/broadcast pipeline so the helper exercises the same
    // code paths as the bridge — divergence between fixtures and production
    // would hide regressions in coin-stellar itself.
    await createTrustline({
      accountAddress: RECIPIENT_ADDRESS,
      accountSeed: RECIPIENT_SEED,
      assetCode: USDC_ASSET_CODE,
      assetIssuer: ISSUER_ADDRESS,
    });

    closeMsw = initMswHandlers();

    const account = makeAccount(address);
    return { currencyBridge, accountBridge, account };
  },

  /**
   * Inject 100 USDC into the test account exactly once, the first time we see
   * a synced sub-account for USDC_TOKEN. Lives in `beforeEach` (rather than
   * `setup`) because the trustline is created by the bridge in the previous
   * scenario transaction — the issuer payment can only succeed after that.
   */
  beforeEach: async account => {
    if (usdcInjected) return;
    const sub = findUsdcSubAccount(account);
    if (!sub) return;
    await sendIssuerPayment({
      issuerAddress: ISSUER_ADDRESS,
      issuerSeed: ISSUER_SEED,
      recipientAddress: account.freshAddress,
      assetCode: USDC_ASSET_CODE,
      amountStroops: BigInt(100 * 1e7),
    });
    usdcInjected = true;
  },

  getTransactions: address => makeScenarioTransactions(address),

  beforeAll: account => {
    // Friendbot funds the account via a `create_account` op surfaced as IN.
    expect(account.currency.id).toBe(STELLAR.id);
    expect(account.balance.toNumber()).toBeGreaterThan(9_999 * 1e7);
    expect(account.operations.length).toBe(1);
    expect(account.operations[0].type).toBe("IN");
  },

  afterAll: account => {
    const outOps = account.operations.filter(op => op.type === "OUT");
    expect(outOps.length).toBeGreaterThanOrEqual(6);
    expect(account.spendableBalance.toString()).toBe("0");
    const sub = findUsdcSubAccount(account);
    expect(sub).toBeDefined();
    expect(sub!.balance.toString()).toBe("0");

    // Every memo type round-tripped: find one OUT op per memo type and
    // verify the value made it back from Horizon unchanged.
    const memoOps = outOps
      .map(
        op =>
          (op.extra as { memo?: { type: string; value?: string } })?.memo as
            | { type: string; value?: string }
            | undefined,
      )
      .filter((m): m is { type: string; value?: string } => !!m && m.type !== "NO_MEMO");
    const byType = new Map(memoOps.map(m => [m.type, m.value]));
    expect(byType.get("MEMO_TEXT")).toBe(MEMO_TEXT_VALUE);
    expect(byType.get("MEMO_ID")).toBe(MEMO_ID_VALUE);
    expect(byType.get("MEMO_HASH")).toBe(MEMO_HASH_HEX);
    expect(byType.get("MEMO_RETURN")).toBe(MEMO_RETURN_HEX);
  },

  teardown: async () => {
    closeMsw?.();
    closeMsw = null;
    usdcInjected = false;
    await killStellarQuickstart();
  },
};
