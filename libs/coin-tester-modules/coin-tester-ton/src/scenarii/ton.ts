import BigNumber from "bignumber.js";
import { firstValueFrom, reduce } from "rxjs";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Account, AccountBridge, Operation } from "@ledgerhq/types-live";
import { Address } from "@ton/core";
import { getTonBridges } from "../bridges";
import { fund } from "../faucet";
import { ACCOUNT_INDICES, makeAccount, pathAt, scenarioCoinConfig } from "../fixtures";
import { friendlyAddressAt } from "../signer";

const TON = new BigNumber(1e9);
const FUNDING = TON.times(100);
const COMMENT = "coin tester";

const recipientOf = (strategy: BridgeStrategy): string =>
  friendlyAddressAt(pathAt(ACCOUNT_INDICES[strategy].recipient));

// `afterAll` only receives the scenario account.
let accountBridge: AccountBridge<GenericTransaction>;
let closeGuard: (() => void) | undefined;

const sync = (account: Account): Promise<Account> =>
  firstValueFrom(
    accountBridge.sync(account, { paginationConfig: {} }).pipe(reduce((acc, f) => f(acc), account)),
  );

const RECIPIENT_SYNC_ATTEMPTS = 10;
const RECIPIENT_SYNC_INTERVAL_MS = 1_000;

// `afterAll` runs once, outside the per-send retries.
async function syncReceipts(strategy: BridgeStrategy, expected: number): Promise<Operation[]> {
  for (let attempt = 1; ; attempt++) {
    const { operations } = await sync(makeAccount(ACCOUNT_INDICES[strategy].recipient, strategy));
    if (operations.length >= expected || attempt === RECIPIENT_SYNC_ATTEMPTS) return operations;
    await new Promise(resolve => setTimeout(resolve, RECIPIENT_SYNC_INTERVAL_MS));
  }
}

// The generic adapter adds the fee to an outgoing value; the legacy bridge does not.
const sentValue = (strategy: BridgeStrategy, operation: Operation): BigNumber =>
  strategy === "legacy" ? operation.value : operation.value.minus(operation.fee);

function newestOperation(previousAccount: Account, currentAccount: Account): Operation {
  expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
  return currentAccount.operations[0];
}

function expectSent(
  strategy: BridgeStrategy,
  previousAccount: Account,
  currentAccount: Account,
  amount?: BigNumber,
) {
  const operation = newestOperation(previousAccount, currentAccount);
  expect(operation.type).toBe("OUT");
  expect(operation.hasFailed).toBe(false);
  expect(operation.recipients).toEqual([recipientOf(strategy)]);
  expect(operation.fee.isGreaterThan(0)).toBe(true);
  if (amount) expect(sentValue(strategy, operation).toFixed()).toBe(amount.toFixed());
  expect(currentAccount.balance.toFixed()).toBe(
    previousAccount.balance.minus(sentValue(strategy, operation)).minus(operation.fee).toFixed(),
  );
  return operation;
}

const transactions = (
  strategy: BridgeStrategy,
): ScenarioTransaction<GenericTransaction, Account>[] => [
  {
    name: "Send 1 TON from the undeployed wallet, which deploys it",
    recipient: recipientOf(strategy),
    amount: TON,
    expect: (previousAccount, currentAccount) => {
      expectSent(strategy, previousAccount, currentAccount, TON);
    },
  },
  {
    name: "Send 0.5 TON with a comment",
    recipient: recipientOf(strategy),
    amount: TON.div(2),
    memoType: "comment",
    memoValue: COMMENT,
    expect: (previousAccount, currentAccount) => {
      const operation = expectSent(strategy, previousAccount, currentAccount, TON.div(2));
      expect(operation.extra).toMatchObject({ comment: { isEncrypted: false, text: COMMENT } });
      if (strategy === "generic-adapter") expect(operation.extra).toMatchObject({ memo: COMMENT });
    },
  },
  {
    name: "Send max",
    recipient: recipientOf(strategy),
    useAllAmount: true,
    expect: (previousAccount, currentAccount) => {
      expectSent(strategy, previousAccount, currentAccount);
      expect(currentAccount.balance.toFixed()).toBe("0");
    },
  },
];

export const scenarioTon: Scenario<GenericTransaction, Account> = {
  name: "TON local chain",

  setup: async strategy => {
    closeGuard = forbidRemoteRequests();
    LiveConfig.setConfig({
      config_currency_ton: { type: "object", default: scenarioCoinConfig },
    });
    // The legacy sync hashes the token list; the local chain has no jettons.
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });

    const bridges = await getTonBridges(strategy);
    accountBridge = bridges.accountBridge;

    const account = makeAccount(ACCOUNT_INDICES[strategy].sender, strategy);
    await fund(Address.parse(account.freshAddress), BigInt(FUNDING.toFixed()));

    // The local chain takes 3 to 24 s to include an external message (measured), which stays
    // valid 60 s: the retries outlast that.
    return { ...bridges, account, retryLimit: 30, retryInterval: 2_500 };
  },

  getTransactions: (_address, strategy) => transactions(strategy),

  beforeAll: account => {
    const [funding] = account.operations;
    expect(account.operations).toHaveLength(1);
    expect(funding.type).toBe("IN");
    expect(funding.value.toFixed()).toBe(FUNDING.toFixed());
    expect(account.balance.toFixed()).toBe(FUNDING.minus(funding.fee).toFixed());
  },

  afterAll: async (account, strategy) => {
    const sent = account.operations.filter(operation => operation.type === "OUT");
    expect(sent).toHaveLength(3);

    const received = await syncReceipts(strategy, sent.length);
    expect(received).toHaveLength(3);
    received.forEach(operation => {
      expect(operation.type).toBe("IN");
      expect(operation.senders).toEqual([account.freshAddress]);
    });
    expect(received.map(operation => operation.value.toFixed()).sort()).toEqual(
      sent.map(operation => sentValue(strategy, operation).toFixed()).sort(),
    );
  },

  teardown: () => {
    closeGuard?.();
  },
};
