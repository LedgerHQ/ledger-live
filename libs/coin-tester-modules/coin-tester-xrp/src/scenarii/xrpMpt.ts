import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account, OperationType } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import {
  expectLatestTokenOperation,
  expectParentRow,
  expectTokenSend,
  findSubAccount,
  getFeesPaid,
  getLockedReserve,
  getSubAccount,
} from "../assert";
import { makeXrpAccount } from "../fixtures";
import { createFundedWallet, getBridges, setLocalXrpConfig } from "../helpers";
import {
  authorizeMpt,
  clawbackMpt,
  createMptIssuance,
  issue,
  TF_MPT_CAN_CLAWBACK,
  TF_MPT_CAN_LOCK,
  TF_MPT_CAN_TRANSFER,
  TF_MPT_UNAUTHORIZE,
} from "../local-tx";
import {
  getMpToken,
  getOwnerReserveIncrement,
  getSendMaxValue,
  getTransactionFlags,
  startXrpSandbox,
  waitForOperationInclusion,
} from "../rippled";
import { buildXrpSigner, type XrplWallet } from "../signer";
import { installTokenStore, makeMptToken } from "../tokenFixtures";

type MptStep = {
  transaction: ScenarioTransaction<GenericTransaction, Account>;
  /** Runs before the sync that gives the step its previous account */
  before?: () => Promise<void>;
};

const FUNDING_XRP = 100;
/** 1%, in units of 0.001% */
const TRANSFER_FEE = 1000;
const ASSET_SCALE = 2;

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | undefined;
let holder: XrplWallet;
let issuer: XrplWallet;
let secondHolder: XrplWallet;
let issuanceId: string;
let reserveIncrement: BigNumber;
let steps: MptStep[] = [];
let stepIndex = 0;
let pendingType: OperationType | undefined;

async function getLedgerBalance(address: string): Promise<string | undefined> {
  const mpToken = await getMpToken(address, issuanceId);
  if (!mpToken) return undefined;

  return mpToken.MPTAmount ?? "0";
}

async function expectLedgerBalance(account: Account, token: TokenCurrency): Promise<void> {
  const balance = await getLedgerBalance(holder.address);
  expect(getSubAccount(account, token.id).balance.toFixed()).toBe(balance);
}

function makeSteps(account: Account, mpt: TokenCurrency): MptStep[] {
  const mptAccountId = encodeTokenAccountId(account.id, mpt);

  return [
    {
      transaction: {
        name: "Opt in to the MPT",
        mode: "changeTrust",
        assetReference: issuanceId,
        assetOwner: issuer.address,
        amount: new BigNumber(0),
        expect: async (previous, current) => {
          expect(pendingType).toBe("OPT_IN");
          expectParentRow(previous, current, "OPT_IN");
          expect(getSubAccount(current, mpt.id).balance.toFixed()).toBe("0");
          expect(await getLedgerBalance(holder.address)).toBe("0");
          expect(getLockedReserve(current)).toStrictEqual(
            getLockedReserve(previous).plus(reserveIncrement),
          );
        },
      },
    },
    {
      before: () => issue(issuer, holder.address, { mpt_issuance_id: issuanceId, value: "10000" }),
      transaction: {
        name: "Send 1000 to a second holder under a 1% transfer fee",
        subAccountId: mptAccountId,
        recipient: secondHolder.address,
        amount: new BigNumber(1000),
        expect: async (previous, current) => {
          expectLatestTokenOperation(previous, mpt.id, { type: "IN", value: new BigNumber(10000) });

          // Valued with the transfer fee: the account's own balance change
          const value = new BigNumber(1010);
          expectTokenSend(previous, current, mpt.id, { value, recipient: secondHolder.address });
          await expectLedgerBalance(current, mpt);
          expect(await getLedgerBalance(secondHolder.address)).toBe("1000");
        },
      },
    },
    {
      // Leaves 8586: send max delivers 8500, the fee is exactly 85 and 1 stays
      before: () => clawbackMpt(issuer, { holder: holder.address, issuanceId, value: "404" }),
      transaction: {
        name: "Send max to the second holder after a clawback",
        subAccountId: mptAccountId,
        recipient: secondHolder.address,
        useAllAmount: true,
        expect: async (previous, current) => {
          expectLatestTokenOperation(previous, mpt.id, { type: "OUT", value: new BigNumber(404) });
          expect(getSubAccount(previous, mpt.id).balance.toFixed()).toBe("8586");

          const value = new BigNumber(8585);
          const sent = expectTokenSend(previous, current, mpt.id, {
            value,
            recipient: secondHolder.address,
          });
          expect(await getSendMaxValue(sent.hash)).toBe("8585");
          await expectLedgerBalance(current, mpt);
          expect(await getLedgerBalance(secondHolder.address)).toBe("9500");
        },
      },
    },
    {
      transaction: {
        name: "Send max to the issuer, which takes no fee",
        subAccountId: mptAccountId,
        recipient: issuer.address,
        useAllAmount: true,
        expect: async (previous, current) => {
          const value = new BigNumber(1);
          expectTokenSend(previous, current, mpt.id, { value, recipient: issuer.address });
          await expectLedgerBalance(current, mpt);
          expect(getSubAccount(current, mpt.id).balance.toFixed()).toBe("0");
        },
      },
    },
    {
      transaction: {
        name: "Remove the MPT",
        mode: "optOut",
        assetReference: issuanceId,
        assetOwner: issuer.address,
        amount: new BigNumber(0),
        expect: async (previous, current) => {
          const row = expectParentRow(previous, current, "OPT_OUT");
          expect(await getTransactionFlags(row.hash)).toBe(TF_MPT_UNAUTHORIZE);
          expect(await getMpToken(holder.address, issuanceId)).toBeUndefined();
          expect(findSubAccount(current, mpt.id)).toBeUndefined();
          expect(getLockedReserve(current)).toStrictEqual(
            getLockedReserve(previous).minus(reserveIncrement),
          );
        },
      },
    },
  ];
}

export const scenarioXrpMpt: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live XRP — MPT tokens",

  setup: async () => {
    closeGuard = forbidRemoteRequests();
    sandbox = await startXrpSandbox();
    setLocalXrpConfig(["iou", "mpt"]);
    reserveIncrement = await getOwnerReserveIncrement();

    holder = await createFundedWallet(sandbox, FUNDING_XRP);
    issuer = await createFundedWallet(sandbox, FUNDING_XRP);
    secondHolder = await createFundedWallet(sandbox, FUNDING_XRP);

    issuanceId = await createMptIssuance(issuer, {
      assetScale: ASSET_SCALE,
      flags: TF_MPT_CAN_LOCK | TF_MPT_CAN_TRANSFER | TF_MPT_CAN_CLAWBACK,
      transferFee: TRANSFER_FEE,
    });
    await authorizeMpt(secondHolder, issuanceId);

    const { currencyBridge, accountBridge } = await getBridges(buildXrpSigner(holder));
    const account = makeXrpAccount(holder.address);
    const mpt = makeMptToken({
      issuanceId,
      issuer: issuer.address,
      ticker: "MPT",
      assetScale: ASSET_SCALE,
    });
    installTokenStore([mpt]);
    steps = makeSteps(account, mpt);
    stepIndex = 0;

    return { currencyBridge, accountBridge, account, retryInterval: 2000, retryLimit: 20 };
  },

  getTransactions: () => steps.map(({ transaction }) => transaction),

  beforeAll: account => {
    expect(account.balance).toStrictEqual(new BigNumber(FUNDING_XRP).shiftedBy(6));
    expect(account.subAccounts).toStrictEqual([]);
  },

  beforeEach: async () => {
    await steps[stepIndex]?.before?.();
    stepIndex += 1;
  },

  mockIndexer: async (_account, optimistic) => {
    pendingType = optimistic.type;
    await waitForOperationInclusion(optimistic.hash);
  },

  afterAll: account => {
    expect(account.subAccounts).toStrictEqual([]);
    expect(account.operations.filter(op => op.type === "OPT_IN")).toHaveLength(1);
    expect(account.operations.filter(op => op.type === "OPT_OUT")).toHaveLength(1);

    const funding = new BigNumber(FUNDING_XRP).shiftedBy(6);
    expect(account.balance).toStrictEqual(funding.minus(getFeesPaid(account)));
  },

  teardown: async () => {
    closeGuard?.();
    await sandbox?.down();
    sandbox = undefined;
  },
};
