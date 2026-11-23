import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import {
  FILECOIN,
  FIL_AIRDROP,
  RECIPIENT_ETH,
  RECIPIENT_F1,
  RECIPIENT_F1_FRESH,
  SEND_FIL,
  SEND_USDFC,
  TEST_MNEMONIC,
  USDFC,
  USDFC_AIRDROP,
  installTokenStore,
  makeFilecoinAccount,
  usdfcSubAccountId,
} from "../fixtures";
import { fundAccount, getBridges, setLocalFilecoinConfig } from "../helpers";
import { indexerUrl, reservedGas, startFilecoinSandbox, waitForMessage } from "../sandbox";
import { buildFilecoinSigner, buildGenericFilecoinSigner, deriveAccount } from "../signer";

type FilecoinScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const TOKEN_UNIT = new BigNumber(10).pow(18);

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | undefined;
let subAccountId = "";

function newestOp(account: Account) {
  return account.operations[0];
}

function tokenAccount(account: Account) {
  return account.subAccounts?.find(sub => sub.id === subAccountId);
}

function makeTransactions(strategy: string): FilecoinScenarioTransaction[] {
  const sendNative: FilecoinScenarioTransaction = {
    name: "Send 1 FIL to an f1 recipient",
    amount: SEND_FIL,
    recipient: RECIPIENT_F1,
    expect: (previous, current) => {
      expect(current.operations.length).toBe(previous.operations.length + 1);
      const latest = newestOp(current);
      expect(latest.type).toBe("OUT");
      expect(latest.value).toStrictEqual(SEND_FIL.plus(latest.fee));
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
    },
  };

  const sendToEthAddress: FilecoinScenarioTransaction = {
    name: "Send 1 FIL to a 0x recipient",
    amount: SEND_FIL,
    recipient: RECIPIENT_ETH,
    expect: (previous, current) => {
      const latest = newestOp(current);
      expect(current.operations.length).toBe(previous.operations.length + 1);
      expect(latest.type).toBe("OUT");
      // The node records the delegated (f410) form of the address the bridge was given
      expect(latest.recipients).toHaveLength(1);
      expect(latest.recipients[0]).toMatch(/^f410f[a-z2-7]+$/);
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
    },
  };

  const sendToken: FilecoinScenarioTransaction = {
    name: "Send 10 USDFC",
    amount: SEND_USDFC,
    recipient: RECIPIENT_ETH,
    subAccountId,
    expect: (previous, current) => {
      const before = previous.subAccounts?.find(sub => sub.id === subAccountId);
      const after = tokenAccount(current);
      expect(before).toBeDefined();
      expect(after).toBeDefined();
      expect(after!.operations.length).toBe(before!.operations.length + 1);
      expect(after!.operations[0].type).toBe("OUT");
      expect(after!.operations[0].value).toStrictEqual(SEND_USDFC);
      expect(after!.balance).toStrictEqual(before!.balance.minus(SEND_USDFC));
    },
  };

  const sendAllToken: FilecoinScenarioTransaction = {
    name: "Send all USDFC",
    recipient: RECIPIENT_ETH,
    subAccountId,
    useAllAmount: true,
    expect: (previous, current) => {
      const before = previous.subAccounts?.find(sub => sub.id === subAccountId);
      const after = tokenAccount(current);
      expect(after!.operations.length).toBe(before!.operations.length + 1);
      expect(after!.operations[0].type).toBe("OUT");
      expect(after!.spendableBalance.toNumber()).toBe(0);
    },
  };

  // The recipient is new: the node's gas estimate for a send to an existing account leaves out the
  // balance update a non-zero value costs, so a send max to RECIPIENT_F1 runs out of gas.
  // The bridge reserves fee cap x gas limit and the node refunds what the message did not use, so
  // what stays is positive and at most that reservation.
  const sendMax: FilecoinScenarioTransaction = {
    name: "Send max FIL to a new f1 recipient",
    recipient: RECIPIENT_F1_FRESH,
    useAllAmount: true,
    expect: async (previous, current) => {
      expect(current.operations.length).toBeGreaterThan(previous.operations.length);
      const latest = newestOp(current);
      expect(latest.type).toBe("OUT");
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
      const reserved = await reservedGas(latest.hash);
      expect(current.balance.isGreaterThan(0)).toBe(true);
      expect(current.balance.isLessThanOrEqualTo(new BigNumber(reserved.toString()))).toBe(true);
    },
  };

  return [
    sendNative,
    sendToEthAddress,
    ...(strategy === "legacy" ? [sendToken, sendAllToken] : []),
    sendMax,
  ];
}

export const scenarioFilecoin: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Filecoin — send scenarios",

  setup: async strategy => {
    closeGuard = forbidRemoteRequests();
    installTokenStore();
    sandbox = await startFilecoinSandbox();
    setLocalFilecoinConfig(indexerUrl(sandbox));

    const path = "44'/461'/0'/0/0";
    const address = deriveAccount(TEST_MNEMONIC, path).address.toString();
    const { currencyBridge, accountBridge } = await getBridges(strategy, {
      legacy: buildFilecoinSigner(TEST_MNEMONIC),
      generic: buildGenericFilecoinSigner(TEST_MNEMONIC),
    });

    await fundAccount(sandbox, address, strategy === "legacy");

    const account = makeFilecoinAccount(address, 0);
    subAccountId = usdfcSubAccountId(account.id);
    return { currencyBridge, accountBridge, account, retryInterval: 4000, retryLimit: 15 };
  },

  getTransactions: (_, strategy) => makeTransactions(strategy),

  mockIndexer: async (_account, optimistic) => {
    await waitForMessage(optimistic.hash);
  },

  beforeAll: (account, strategy) => {
    expect(account.currency.id).toBe(FILECOIN.id);
    expect(account.balance).toStrictEqual(TOKEN_UNIT.times(FIL_AIRDROP));
    expect(account.operations.filter(op => op.type === "IN")).toHaveLength(1);
    expect(account.operations.filter(op => op.type === "OUT")).toHaveLength(0);
    if (strategy === "legacy") {
      const token = tokenAccount(account);
      expect(token?.token.id).toBe(USDFC.id);
      expect(token?.balance).toStrictEqual(TOKEN_UNIT.times(USDFC_AIRDROP));
      expect(token?.operations.filter(op => op.type === "IN")).toHaveLength(1);
    }
  },

  afterAll: (account, strategy) => {
    const count = (type: string) => account.operations.filter(op => op.type === type).length;
    if (strategy === "legacy") {
      expect(count("OUT")).toBe(3);
      expect(count("FEES")).toBe(2);
      expect(count("IN")).toBe(1);
      const token = tokenAccount(account);
      expect(token?.operations.filter(op => op.type === "OUT")).toHaveLength(2);
      expect(token?.operations.filter(op => op.type === "IN")).toHaveLength(1);
    } else {
      expect(count("OUT")).toBe(3);
      expect(count("IN")).toBe(1);
    }
  },

  teardown: async () => {
    closeGuard?.();
    closeGuard = undefined;
    await sandbox?.down();
    sandbox = undefined;
  },
};
