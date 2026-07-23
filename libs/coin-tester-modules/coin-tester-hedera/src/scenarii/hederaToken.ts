import { PrivateKey } from "@hashgraph/sdk";
import type { Scenario } from "@ledgerhq/coin-tester/main";
import type { Transaction, HederaAccount } from "@ledgerhq/coin-hedera/types";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import BigNumber from "bignumber.js";
import { TOKEN_DECIMALS, TOKEN_SYMBOL, makeHederaAccount, makeLocalHtsToken } from "../fixtures";
import { type HederaScenarioTransaction, setupHederaScenario } from "../helpers";
import {
  associateToken,
  createFundedAccount,
  createHtsToken,
  transferToken,
  waitForMirrorNodeTokenBalance,
} from "../genesis";

const UNIT = 10 ** TOKEN_DECIMALS;
const TOKEN_INITIAL_SUPPLY = 1_000 * UNIT;
const TOKEN_INJECTED = 100 * UNIT;
const TOKEN_SENT = 10 * UNIT;

let closeMswHandlers: (() => void) | undefined;
let token: TokenCurrency;
let tokenId: string;
let accountId: string;
let tokenRecipientId: string;
/** Guards the one-shot treasury→account injection performed in `beforeEach`. */
let injected = false;
/**
 * Counts `beforeEach` invocations so the injection is keyed on transaction position rather than on
 * probing the sub-account's shape (see the comment on `beforeEach` below).
 */
let beforeEachCallIndex = 0;

function findTokenSubAccount(account: HederaAccount): TokenAccount | undefined {
  return account.subAccounts?.find(sa => sa.type === "TokenAccount" && sa.token.id === token.id) as
    | TokenAccount
    | undefined;
}

function makeTransactions(): HederaScenarioTransaction[] {
  const associate: HederaScenarioTransaction = {
    name: `Associate ${TOKEN_SYMBOL}`,
    family: "hedera",
    mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
    assetReference: tokenId,
    assetOwner: accountId,
    properties: { token },
    amount: new BigNumber(0),
    recipient: accountId,
    expect: (previous, current) => {
      expect(current.operations.length).toBeGreaterThan(previous.operations.length);
      // getSubAccounts builds this from mirrorTokens alone — an associated HTS token with no
      // operations and a zero balance still yields a sub-account (bridge/utils.ts:234-274).
      const subAccount = findTokenSubAccount(current);
      expect(subAccount).toBeDefined();
      if (!subAccount) return;
      expect(subAccount.balance.toString()).toBe("0");
    },
  };

  const sendToken: HederaScenarioTransaction = {
    name: `Send ${TOKEN_SENT / UNIT} ${TOKEN_SYMBOL} to a freshly associated account`,
    family: "hedera",
    mode: HEDERA_TRANSACTION_MODES.Send,
    subAccountId: encodeTokenAccountId(makeHederaAccount(accountId, "").id, token),
    amount: new BigNumber(TOKEN_SENT),
    recipient: tokenRecipientId,
    expect: (previous, current) => {
      const previousSub = findTokenSubAccount(previous);
      const currentSub = findTokenSubAccount(current);
      // Assert (not destructure) so an empty/missing sub-account from mirror-node lag is a
      // retryable Jest failure, not a hard TypeError — mirrors the guard in scenarii/hedera.ts.
      // A token sub-account with `operations: []` is a normal constructible state
      // (bridge/utils.ts:235-273 builds it from mirrorTokens alone), so it must be checked
      // explicitly before destructuring `operations[0]`.
      expect(previousSub).toBeDefined();
      expect(currentSub).toBeDefined();
      if (!previousSub || !currentSub) return;
      expect(currentSub.operations.length).toBeGreaterThan(0);
      expect(currentSub.balance.toString()).toBe(previousSub.balance.minus(TOKEN_SENT).toString());
      const [latest] = currentSub.operations;
      expect(latest.type).toBe("OUT");
      expect(latest.value.toString()).toBe(String(TOKEN_SENT));
    },
  };

  return [associate, sendToken];
}

export const scenarioHederaToken: Scenario<Transaction, HederaAccount> = {
  name: "Ledger Live Hedera — HTS association and transfer",

  setup: async () => {
    // Created before `setupHederaScenario` so the token is known when the crypto-assets store is
    // installed — installing the store is unskippable and takes the token list as a required
    // argument. `createHtsToken` only needs the genesis client, not the account under test, so
    // this ordering doesn't change what gets created, only when.
    tokenId = await createHtsToken({
      decimals: TOKEN_DECIMALS,
      symbol: TOKEN_SYMBOL,
      initialSupply: TOKEN_INITIAL_SUPPLY,
    });
    token = makeLocalHtsToken(tokenId);

    const {
      currencyBridge,
      accountBridge,
      publicKey,
      accountId: newAccountId,
      close,
    } = await setupHederaScenario([token]);
    closeMswHandlers = close;
    accountId = newAccountId;

    // A separate fixture account, associated via the raw SDK, so the send under test targets an
    // account that is genuinely associated. RECIPIENT (0.0.1002) is Solo-created and its key is
    // not ours, so it cannot be associated and an HTS transfer to it would fail.
    const recipientKey = PrivateKey.generateED25519();
    tokenRecipientId = await createFundedAccount(recipientKey.publicKey.toStringRaw(), 1);
    await associateToken(tokenRecipientId, recipientKey, tokenId);

    injected = false;
    beforeEachCallIndex = 0;

    return {
      currencyBridge,
      accountBridge,
      account: makeHederaAccount(accountId, publicKey),
      retryInterval: 2000,
      retryLimit: 20,
    };
  },

  // HTS requires the receiver to be associated first, so the treasury cannot pre-fund the account
  // in setup(); the injection has to sit between the two transactions. The runner calls `beforeEach`
  // once per transaction in order, so the first call precedes `associate` (nothing to inject yet)
  // and the second precedes `sendToken` (inject here). This is keyed on that call position rather
  // than on probing whether the sub-account exists yet: probing fails open — if the associate
  // assertion were ever relaxed or sub-account resolution regressed, a shape-based guard would
  // silently skip the injection and the failure would surface two steps later as a non-retried
  // NotEnoughBalance from `getTransactionStatus`, pointing at the send rather than the missing
  // injection. Keying on position instead lets a miss throw with a message naming the cause.
  // Reorder `associate` and `sendToken` and this stops firing correctly.
  beforeEach: async account => {
    const callIndex = beforeEachCallIndex++;
    if (callIndex === 0) return; // precedes `associate`: the sub-account cannot exist yet.
    if (injected) return;

    const subAccount = findTokenSubAccount(account);
    if (!subAccount) {
      throw new Error(
        `hederaToken scenario: expected the ${TOKEN_SYMBOL} sub-account to exist before injecting ` +
          `the treasury transfer (beforeEach call #${callIndex + 1}, following the "associate" ` +
          "transaction), but found none. The transaction order likely changed, or sub-account " +
          "resolution regressed.",
      );
    }

    await transferToken(tokenId, account.freshAddress, TOKEN_INJECTED);
    // The runner syncs right after this and then calls getTransactionStatus, which is *not*
    // retried: without waiting for indexing, the sub-account reads 0 and the send fails with
    // NotEnoughBalance (getTransactionStatus.ts:160).
    await waitForMirrorNodeTokenBalance(account.freshAddress, tokenId, TOKEN_INJECTED);
    injected = true;
  },

  getTransactions: () => makeTransactions(),

  teardown: () => {
    closeMswHandlers?.();
  },
};
