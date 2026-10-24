import BigNumber from "bignumber.js";
import { firstValueFrom, reduce } from "rxjs";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Account, AccountBridge, Operation } from "@ledgerhq/types-live";
import { Address } from "@ton/core";
import { getTonGenericBridges } from "../bridges";
import { fund } from "../faucet";
import {
  RECIPIENT_INDEX,
  SENDER_INDEX,
  makeAccount,
  pathAt,
  scenarioCoinConfig,
} from "../fixtures";
import { buildSigner, friendlyAddressAt } from "../signer";

const TON = new BigNumber(1e9);
const FUNDING = TON.times(100);
const COMMENT = "coin tester";

const recipient = friendlyAddressAt(pathAt(RECIPIENT_INDEX));

// `afterAll` only receives the scenario account.
let accountBridge: AccountBridge<GenericTransaction>;
let closeGuard: (() => void) | undefined;

const sync = (account: Account): Promise<Account> =>
  firstValueFrom(
    accountBridge.sync(account, { paginationConfig: {} }).pipe(reduce((acc, f) => f(acc), account)),
  );

function newestOperation(previousAccount: Account, currentAccount: Account): Operation {
  expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
  return currentAccount.operations[0];
}

function expectSent(previousAccount: Account, currentAccount: Account, amount?: BigNumber) {
  const operation = newestOperation(previousAccount, currentAccount);
  expect(operation.type).toBe("OUT");
  expect(operation.hasFailed).toBe(false);
  expect(operation.recipients).toEqual([recipient]);
  expect(operation.fee.isGreaterThan(0)).toBe(true);
  // The generic adapter adds the fee to an outgoing value.
  if (amount) expect(operation.value.toFixed()).toBe(amount.plus(operation.fee).toFixed());
  expect(currentAccount.balance.toFixed()).toBe(
    previousAccount.balance.minus(operation.value).toFixed(),
  );
  return operation;
}

const transactions = (): ScenarioTransaction<GenericTransaction, Account>[] => [
  {
    name: "Send 1 TON from the undeployed wallet, which deploys it",
    recipient,
    amount: TON,
    expect: (previousAccount, currentAccount) => expectSent(previousAccount, currentAccount, TON),
  },
  {
    name: "Send 0.5 TON with a comment",
    recipient,
    amount: TON.div(2),
    memoType: "comment",
    memoValue: COMMENT,
    expect: (previousAccount, currentAccount) => {
      const operation = expectSent(previousAccount, currentAccount, TON.div(2));
      expect(operation.extra).toMatchObject({
        memo: COMMENT,
        comment: { isEncrypted: false, text: COMMENT },
      });
    },
  },
  {
    name: "Send max",
    recipient,
    useAllAmount: true,
    expect: (previousAccount, currentAccount) => {
      expectSent(previousAccount, currentAccount);
      expect(currentAccount.balance.toFixed()).toBe("0");
    },
  },
];

export const scenarioTon: Scenario<GenericTransaction, Account> = {
  name: "TON local chain — generic adapter",

  setup: async () => {
    closeGuard = forbidRemoteRequests();
    LiveConfig.setConfig({
      config_currency_ton: { type: "object", default: scenarioCoinConfig },
    });

    const bridges = await getTonGenericBridges(buildSigner());
    accountBridge = bridges.accountBridge;

    const account = makeAccount(SENDER_INDEX);
    await fund(Address.parse(account.freshAddress), BigInt(FUNDING.toFixed()));

    // The local chain takes 3 to 24 s to include an external message (measured), which stays
    // valid 60 s: the retries outlast that.
    return { ...bridges, account, retryLimit: 30, retryInterval: 2_500 };
  },

  getTransactions: () => transactions(),

  beforeAll: account => {
    const [funding] = account.operations;
    expect(account.operations).toHaveLength(1);
    expect(funding.type).toBe("IN");
    expect(funding.value.toFixed()).toBe(FUNDING.toFixed());
    expect(account.balance.toFixed()).toBe(FUNDING.minus(funding.fee).toFixed());
  },

  afterAll: async account => {
    const sent = account.operations.filter(operation => operation.type === "OUT");
    expect(sent).toHaveLength(3);

    const received = (await sync(makeAccount(RECIPIENT_INDEX))).operations;
    expect(received).toHaveLength(3);
    received.forEach(operation => {
      expect(operation.type).toBe("IN");
      expect(operation.senders).toEqual([account.freshAddress]);
    });
    expect(received.map(operation => operation.value.toFixed()).sort()).toEqual(
      sent.map(operation => operation.value.minus(operation.fee).toFixed()).sort(),
    );
  },

  teardown: () => {
    closeGuard?.();
  },
};
