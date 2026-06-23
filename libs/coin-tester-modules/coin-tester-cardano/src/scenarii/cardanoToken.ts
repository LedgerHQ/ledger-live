import { extractPaymentKeyFromAddress } from "@ledgerhq/coin-cardano/utils";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { Scenario } from "@ledgerhq/coin-tester/main";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  CARDANO,
  FRESH_ADDRESS_PATH,
  TEST_TOKEN,
  TEST_TOKEN_ASSET_NAME,
  TEST_TOKEN_POLICY_ID,
  makeAccount,
} from "../fixtures";
import { getBridges } from "../helpers";
import { fundToken, initMSW, resetLedger } from "../indexer";
import { buildSigner } from "../signer";

const ONE_ADA = 1_000_000n;
const INITIAL_ADA = 10n * ONE_ADA;
const INITIAL_TOKENS = 1000n;
const SEND_TOKENS = new BigNumber(400);
// A valid mainnet base address distinct from the test account's.
const RECIPIENT =
  "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9";

let closeMSW: (() => void) | undefined;
let tokenSubAccountId = "";

function tokenSubAccount(account: Account): TokenAccount | undefined {
  return account.subAccounts?.find(sa => sa.id === tokenSubAccountId) as TokenAccount | undefined;
}

export const scenarioCardanoToken: Scenario<GenericTransaction, Account> = {
  name: "Cardano Native Token Transfer",

  setup: async () => {
    LiveConfig.setConfig({
      config_currency_cardano: {
        type: "object",
        default: { status: { type: "active" }, maxFeesWarning: 0, maxFeesError: 0 },
      },
    });
    closeMSW = initMSW();

    const signer = await buildSigner();
    const { accountBridge, currencyBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: FRESH_ADDRESS_PATH,
      currency: CARDANO,
      derivationMode: "",
    });

    // The token rides in a UTXO with 10 ADA (backs its min-UTXO + the later send's fee + outputs).
    fundToken(extractPaymentKeyFromAddress(address), address, INITIAL_ADA, {
      policyId: TEST_TOKEN_POLICY_ID,
      assetName: TEST_TOKEN_ASSET_NAME,
      value: INITIAL_TOKENS,
    });

    const account = makeAccount(address);
    tokenSubAccountId = encodeTokenAccountId(account.id, TEST_TOKEN);

    return { accountBridge, currencyBridge, account, retryLimit: 0 };
  },

  beforeAll: account => {
    expect(account.balance.toString()).toBe(INITIAL_ADA.toString());
    // The crypto-assets store resolves the native asset → a token sub-account is synced.
    const sub = tokenSubAccount(account);
    expect(sub).toBeDefined();
    expect(sub!.balance.toString()).toBe(INITIAL_TOKENS.toString());
  },

  getTransactions: () => [
    {
      // nonce: 0 — UTXO has no account sequence; skips the generic flow's getNextSequence (which
      // coin-cardano throws on). craftTransaction ignores it.
      name: "Send 400 CTT (native token)",
      amount: SEND_TOKENS,
      recipient: RECIPIENT,
      subAccountId: tokenSubAccountId,
      nonce: new BigNumber(0),
      expect: (previousAccount, currentAccount) => {
        const prevSub = tokenSubAccount(previousAccount);
        const sub = tokenSubAccount(currentAccount);
        expect(sub).toBeDefined();

        // The sub-account records an OUT for the sent token amount, and its balance drops by it.
        const [latest] = sub!.operations;
        expect(latest.type).toBe("OUT");
        expect(latest.value.toString()).toBe(SEND_TOKENS.toString());
        expect(sub!.balance.toString()).toBe(prevSub!.balance.minus(SEND_TOKENS).toString());

        // Tokens are paid in the token; ADA only covers the fee + the recipient output's min-ADA.
        expect(currentAccount.balance.lt(previousAccount.balance)).toBe(true);
      },
    },
  ],

  afterAll: account => {
    expect(tokenSubAccount(account)?.balance.toString()).toBe(
      (INITIAL_TOKENS - BigInt(SEND_TOKENS.toString())).toString(),
    );
  },

  teardown: async () => {
    closeMSW?.();
    resetLedger();
  },
};
