import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { THOR_SOLO_RPC } from "../thorNode";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { VECHAIN, VTHO, initMSW, makeAccount, registerVthoInMockStore } from "../fixtures";
import { getBridges } from "../helpers";
import { killThorNode, spawnThorNode, waitForThorReady } from "../thorNode";
import { buildVechainTestSigner } from "../signer";

/**
 * thor solo's well-known pre-funded dev accounts, each funded with VET and VTHO. Dev account [0] is
 * deliberately avoided: it is the solo network's validator / block-signer, so its balance drifts
 * from block rewards independently of any transaction — confirmed empirically (its balance changed
 * between syncs with no transaction involving it), not verified against vechain/thor's genesis
 * source. Accounts [1] and [2] are plain, uninvolved dev accounts.
 */
const FUNDER_PRIVATE_KEY = "7b067f53d350f1cf20ec13df416b7b73e88a1dc7331bc904b92108b1e76a08b1";
const RECIPIENT_PRIVATE_KEY = "f4a1a17039216f535d42ec23732c79943ffb45a089fbb78a14daad0dae93e991";

let closeMsw: (() => void) | null = null;
let subAccountId = "";
let recipientAddress = "";

type Tx = ScenarioTransaction<GenericTransaction, Account>;

function makeTransactions(): Tx[] {
  const sendVet: Tx = {
    name: "Send 1 VET",
    amount: new BigNumber("1000000000000000000"), // 1 VET (18 decimals)
    recipient: recipientAddress,
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      // Recipients are reported lowercase by the network layer; recipientAddress is EIP-55
      // checksummed (mixed-case), so compare case-insensitively.
      expect(latestOp.recipients.map(r => r.toLowerCase())).toContain(
        recipientAddress.toLowerCase(),
      );
      expect(curr.balance).toStrictEqual(prev.balance.minus(new BigNumber("1000000000000000000")));
      // Fees are paid in VTHO, never deducted from the VET balance directly.
      const vtho = curr.subAccounts?.find(s => s.id === subAccountId);
      const prevVtho = prev.subAccounts?.find(s => s.id === subAccountId);
      expect(vtho).toBeDefined();
      expect(vtho!.balance.lt(prevVtho?.balance ?? new BigNumber(0))).toBe(true);
    },
  };

  const sendVtho: Tx = {
    name: "Send 10 VTHO",
    amount: new BigNumber("10000000000000000000"), // 10 VTHO (18 decimals)
    recipient: recipientAddress,
    subAccountId,
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === subAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === subAccountId);
      expect(sub).toBeDefined();
      // Balance decreases by at least the sent amount — the VIP180 transfer's gas fee is also
      // paid in VTHO, out of the same balance, so the drop is >= the amount sent.
      const expectedMax = (prevSub?.balance ?? new BigNumber(0)).minus("10000000000000000000");
      expect(sub!.balance.lte(expectedMax)).toBe(true);
      // A real (retriable) assertion rather than destructuring an empty array: op indexing can lag
      // one sync behind the balance update.
      expect(sub!.operations.length).toBeGreaterThan(prevSub?.operations.length ?? 0);
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients.map(r => r.toLowerCase())).toContain(
        recipientAddress.toLowerCase(),
      );
    },
  };

  const sendMaxVet: Tx = {
    name: "Send max VET",
    amount: new BigNumber(0),
    useAllAmount: true,
    recipient: recipientAddress,
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients.map(r => r.toLowerCase())).toContain(
        recipientAddress.toLowerCase(),
      );
      expect(curr.balance.isZero()).toBe(true);
      const vtho = curr.subAccounts?.find(s => s.id === subAccountId);
      const prevVtho = prev.subAccounts?.find(s => s.id === subAccountId);
      expect(vtho!.balance.lt(prevVtho?.balance ?? new BigNumber(0))).toBe(true);
    },
  };

  const sendMaxVtho: Tx = {
    name: "Send max VTHO",
    amount: new BigNumber(0),
    useAllAmount: true,
    recipient: recipientAddress,
    subAccountId,
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === subAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === subAccountId);
      expect(sub).toBeDefined();
      expect(sub!.operations.length).toBeGreaterThan(prevSub?.operations.length ?? 0);
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients.map(r => r.toLowerCase())).toContain(
        recipientAddress.toLowerCase(),
      );
      expect(latestOp.value.gt(0)).toBe(true);
      expect(latestOp.value.gt(prevSub!.balance.times(0.99))).toBe(true);
      expect(sub!.balance).toEqual(prevSub!.balance.minus(latestOp.value).minus(latestOp.fee));
      expect(sub!.balance.lte(latestOp.fee.times(10))).toBe(true);
      expect(sub!.balance.lt(prevSub!.balance.times(0.01))).toBe(true);
    },
  };

  // Order matters: max VET must precede max VTHO so VTHO is still available to pay the VET send's gas
  // (max VTHO drains the VTHO balance down to the reserved fee).
  return [sendVet, sendVtho, sendMaxVet, sendMaxVtho];
}

export const scenarioVechain: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live VeChain (VET + VTHO)",

  setup: async strategy => {
    await spawnThorNode();
    const chainTag = await waitForThorReady();

    const funder = buildVechainTestSigner(FUNDER_PRIVATE_KEY);
    const recipient = buildVechainTestSigner(RECIPIENT_PRIVATE_KEY);
    recipientAddress = recipient.address;

    registerVthoInMockStore();

    const localConfig = {
      status: { type: "active" as const },
      chainTag,
      // The module reads its Thor endpoint from the coin config, so the solo node has to be
      // declared here rather than through the environment.
      node: { url: THOR_SOLO_RPC },
    };
    LiveConfig.setConfig({ config_currency_vechain: { type: "object", default: localConfig } });

    closeMsw = initMSW();

    const { currencyBridge, accountBridge } = await getBridges(strategy, funder, chainTag);
    const account = makeAccount(funder.address);
    subAccountId = encodeTokenAccountId(account.id, VTHO);

    return { currencyBridge, accountBridge, account, retryInterval: 4000, retryLimit: 30 };
  },

  getTransactions: () => makeTransactions(),

  beforeAll: account => {
    expect(account.currency.id).toBe(VECHAIN.id);
    expect(account.balance.gt(0)).toBe(true);
    const vtho = account.subAccounts?.find(s => s.id === subAccountId);
    expect(vtho).toBeDefined();
    expect(vtho!.balance.gt(0)).toBe(true);
  },

  // Aggregate end-of-run invariant across the whole scenario (mirrors coin-tester-xrp/kaspa): each
  // native VET send (fixed + max) and each VTHO send (fixed + max) landed exactly once, no loss and
  // no duplication. Balances are not asserted positive here because the two max sends deliberately
  // drain both assets.
  afterAll: account => {
    expect(account.operations.filter(op => op.type === "OUT")).toHaveLength(2);
    const vtho = account.subAccounts?.find(s => s.id === subAccountId);
    expect(vtho).toBeDefined();
    expect(vtho!.operations.filter(op => op.type === "OUT")).toHaveLength(2);
  },

  teardown: async () => {
    closeMsw?.();
    closeMsw = null;
    await killThorNode();
  },
};
