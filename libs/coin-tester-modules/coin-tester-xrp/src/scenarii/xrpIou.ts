import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account, OperationType } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction as XrpTransaction } from "@ledgerhq/live-common/families/xrp/types";
import {
  expectLatestTokenOperation,
  expectParentRow,
  expectTokenSend,
  findSubAccount,
  getFeesPaid,
  getLockedReserve,
  getOperationIds,
  getSubAccount,
} from "../assert";
import { makeXrpAccount } from "../fixtures";
import { createFundedWallet, getBridges, setLocalXrpConfig } from "../helpers";
import {
  ASF_ALLOW_TRUSTLINE_CLAWBACK,
  ASF_DEFAULT_RIPPLE,
  clawbackIou,
  enableAccountFlag,
  issue,
  openTrustLine,
  removeTrustLine,
  setTransferRate,
  TF_CLEAR_NO_RIPPLE,
  TF_SET_NO_RIPPLE,
} from "../local-tx";
import {
  getOwnerReserveIncrement,
  getSendMaxValue,
  getTransactionFlags,
  getTrustLine,
  startXrpSandbox,
  waitForOperationInclusion,
} from "../rippled";
import { buildXrpSigner, type XrplWallet } from "../signer";
import { installTokenStore, makeIouToken, toIouAmount } from "../tokenFixtures";

type IouTransaction = GenericTransaction & Pick<XrpTransaction, "noRipple">;
type IouStep = {
  transaction: ScenarioTransaction<IouTransaction, Account>;
  /** Runs before the sync that gives the step its previous account */
  before?: () => Promise<void>;
};

const FUNDING_XRP = 100;
/** 0.5% on each holder-to-holder transfer, in billionths */
const TRANSFER_RATE = 1_005_000_000;
/** The protocol maximum, as `account_lines` writes it */
const MAX_LIMIT = "9999999999999999e80";

let sandbox: Sandbox | undefined;
let closeGuard: (() => void) | undefined;
let holder: XrplWallet;
let issuer: XrplWallet;
let secondHolder: XrplWallet;
let reserveIncrement: BigNumber;
let steps: IouStep[] = [];
let stepIndex = 0;
let pendingType: OperationType | undefined;

function getLine(code: string) {
  return getTrustLine(holder.address, issuer.address, code);
}

async function expectLedgerBalance(account: Account, token: TokenCurrency): Promise<void> {
  const line = await getLine(token.ticker);
  expect(getSubAccount(account, token.id).balance).toStrictEqual(toIouAmount(line?.balance ?? ""));
}

function makeSteps(
  account: Account,
  { usd, usdLower, eur }: Record<"usd" | "usdLower" | "eur", TokenCurrency>,
): IouStep[] {
  const usdAccountId = encodeTokenAccountId(account.id, usd);
  const usdLowerAccountId = encodeTokenAccountId(account.id, usdLower);

  function optIn(token: TokenCurrency, noRipple?: boolean) {
    return {
      mode: "changeTrust" as const,
      assetReference: token.tokenIdentifier,
      assetOwner: issuer.address,
      amount: MAX_TRUST_LIMIT,
      ...(noRipple === undefined ? {} : { noRipple }),
    };
  }

  // A held line: an edit sends the limit and the No Ripple choice
  function editEur(limit: string, noRipple: boolean) {
    return { ...optIn(eur, noRipple), amount: toIouAmount(limit) };
  }

  async function expectEurEdit(
    previous: Account,
    current: Account,
    { limit, noRipple, flag }: { limit: string; noRipple: boolean; flag: number },
  ) {
    expect(pendingType).toBe("OPT_EDIT");
    const row = expectParentRow(previous, current, "OPT_EDIT");
    // An opt row stays on the parent only: the token account's history is its payments
    expect(getOperationIds(current, eur.id)).toStrictEqual(getOperationIds(previous, eur.id));
    expect((await getTransactionFlags(row.hash)) & flag).toBe(flag);
    const line = await getLine("EUR");
    expect(line?.limit).toBe(limit);
    expect(!!line?.no_ripple).toBe(noRipple);
    expect(getLockedReserve(current)).toStrictEqual(getLockedReserve(previous));
  }

  return [
    {
      transaction: {
        name: "Opt in to USD",
        ...optIn(usd),
        expect: async (previous, current) => {
          expectParentRow(previous, current, "OPT_IN");
          const usdAccount = getSubAccount(current, usd.id);
          expect(usdAccount.balance.toFixed()).toBe("0");
          expect(usdAccount.operations).toStrictEqual([]);
          expect(getLockedReserve(current)).toStrictEqual(
            getLockedReserve(previous).plus(reserveIncrement),
          );
          const line = await getLine("USD");
          expect(line?.limit).toBe(MAX_LIMIT);
          expect(line?.no_ripple).toBe(true);
        },
      },
    },
    {
      transaction: {
        name: "Opt in to usd, a code that differs from USD only by case",
        ...optIn(usdLower),
        expect: (previous, current) => {
          expectParentRow(previous, current, "OPT_IN");
          expect(current.subAccounts?.map(sub => sub.id).sort()).toStrictEqual(
            [usdAccountId, usdLowerAccountId].sort(),
          );
        },
      },
    },
    {
      before: async () => {
        await issue(issuer, holder.address, {
          currency: "USD",
          issuer: issuer.address,
          value: "100",
        });
        await issue(issuer, holder.address, {
          currency: "usd",
          issuer: issuer.address,
          value: "7",
        });
      },
      transaction: {
        name: "Send 10 USD to a second holder under a 0.5% transfer rate",
        subAccountId: usdAccountId,
        recipient: secondHolder.address,
        amount: toIouAmount("10"),
        expect: async (previous, current) => {
          expectLatestTokenOperation(previous, usd.id, { type: "IN", value: toIouAmount("100") });
          expectLatestTokenOperation(previous, usdLower.id, {
            type: "IN",
            value: toIouAmount("7"),
          });

          // Valued with the transfer fee: the account's own balance change
          const value = toIouAmount("10.05");
          expectTokenSend(previous, current, usd.id, { value, recipient: secondHolder.address });
          await expectLedgerBalance(current, usd);
          await expectLedgerBalance(current, usdLower);
          const secondLine = await getTrustLine(secondHolder.address, issuer.address, "USD");
          expect(secondLine?.balance).toBe("10");
          expect(getSubAccount(current, usdLower.id)).toStrictEqual(
            getSubAccount(previous, usdLower.id),
          );
        },
      },
    },
    {
      // Leaves 80.40000000000001: send max delivers 80, the debit is exactly 80.4 and the dust stays
      before: () =>
        clawbackIou(issuer, { holder: holder.address, currency: "USD", value: "9.54999999999999" }),
      transaction: {
        name: "Send max USD to the second holder after a clawback",
        subAccountId: usdAccountId,
        recipient: secondHolder.address,
        useAllAmount: true,
        expect: async (previous, current) => {
          expectLatestTokenOperation(previous, usd.id, {
            type: "OUT",
            value: toIouAmount("9.54999999999999"),
          });
          expect(getSubAccount(previous, usd.id).balance).toStrictEqual(
            toIouAmount("80.40000000000001"),
          );

          const value = toIouAmount("80.4");
          const sent = expectTokenSend(previous, current, usd.id, {
            value,
            recipient: secondHolder.address,
          });
          expect(await getSendMaxValue(sent.hash)).toBe("80.4");
          expect(getSubAccount(current, usd.id).balance).toStrictEqual(toIouAmount("1e-14"));
          await expectLedgerBalance(current, usd);
          const secondLine = await getTrustLine(secondHolder.address, issuer.address, "USD");
          expect(secondLine?.balance).toBe("90");
        },
      },
    },
    {
      before: () =>
        issue(issuer, holder.address, { currency: "USD", issuer: issuer.address, value: "1" }),
      transaction: {
        name: "Send max USD to the issuer, which takes no fee",
        subAccountId: usdAccountId,
        recipient: issuer.address,
        useAllAmount: true,
        expect: async (previous, current) => {
          const value = getSubAccount(previous, usd.id).balance;
          expectTokenSend(previous, current, usd.id, { value, recipient: issuer.address });
          expect(getSubAccount(current, usd.id).balance.toFixed()).toBe("0");
          await expectLedgerBalance(current, usd);
        },
      },
    },
    {
      transaction: {
        name: "Send max usd to the issuer",
        subAccountId: usdLowerAccountId,
        recipient: issuer.address,
        useAllAmount: true,
        expect: async (previous, current) => {
          const value = toIouAmount("7");
          expectTokenSend(previous, current, usdLower.id, { value, recipient: issuer.address });
          await expectLedgerBalance(current, usdLower);
          expect(getSubAccount(current, usd.id)).toStrictEqual(getSubAccount(previous, usd.id));
        },
      },
    },
    {
      before: () => removeTrustLine(holder, { currency: "usd", issuer: issuer.address }),
      transaction: {
        name: "Opt in to EUR with No Rippling off",
        ...optIn(eur, false),
        expect: async (previous, current) => {
          const [removal] = previous.operations;
          expect(removal.type).toBe("OPT_OUT");
          expect(findSubAccount(previous, usdLower.id)).toBeUndefined();

          const row = expectParentRow(previous, current, "OPT_IN");
          expect(pendingType).toBe("OPT_IN");
          const flags = await getTransactionFlags(row.hash);
          expect(flags & TF_CLEAR_NO_RIPPLE).toBe(TF_CLEAR_NO_RIPPLE);
          const line = await getLine("EUR");
          expect(line?.limit).toBe(MAX_LIMIT);
          expect(!!line?.no_ripple).toBe(false);
          expect(getSubAccount(current, eur.id).balance.toFixed()).toBe("0");
        },
      },
    },
    {
      transaction: {
        name: "Lower the EUR limit",
        ...editEur("500", false),
        expect: (previous, current) =>
          expectEurEdit(previous, current, {
            limit: "500",
            noRipple: false,
            flag: TF_CLEAR_NO_RIPPLE,
          }),
      },
    },
    {
      transaction: {
        name: "Turn No Rippling on for EUR",
        ...editEur("500", true),
        expect: (previous, current) =>
          expectEurEdit(previous, current, {
            limit: "500",
            noRipple: true,
            flag: TF_SET_NO_RIPPLE,
          }),
      },
    },
    {
      transaction: {
        name: "Turn No Rippling off again for EUR",
        ...editEur("500", false),
        expect: (previous, current) =>
          expectEurEdit(previous, current, {
            limit: "500",
            noRipple: false,
            flag: TF_CLEAR_NO_RIPPLE,
          }),
      },
    },
    {
      transaction: {
        name: "Remove EUR",
        mode: "optOut",
        assetReference: eur.tokenIdentifier,
        assetOwner: issuer.address,
        amount: new BigNumber(0),
        expect: async (previous, current) => {
          const row = expectParentRow(previous, current, "OPT_OUT");
          expect(await getTransactionFlags(row.hash)).toBe(TF_SET_NO_RIPPLE);
          expect(await getLine("EUR")).toBeUndefined();
          expect(findSubAccount(current, eur.id)).toBeUndefined();
          expect(getLockedReserve(current)).toStrictEqual(
            getLockedReserve(previous).minus(reserveIncrement),
          );
        },
      },
    },
  ];
}

export const scenarioXrpIou: Scenario<IouTransaction, Account> = {
  name: "Ledger Live XRP — IOU tokens",

  setup: async () => {
    closeGuard = forbidRemoteRequests();
    sandbox = await startXrpSandbox();
    setLocalXrpConfig(["iou", "mpt"]);
    reserveIncrement = await getOwnerReserveIncrement();

    holder = await createFundedWallet(sandbox, FUNDING_XRP);
    issuer = await createFundedWallet(sandbox, FUNDING_XRP);
    secondHolder = await createFundedWallet(sandbox, FUNDING_XRP);

    // Clawback can be allowed only before the issuer has any line. Default ripple lets holders pay
    // each other through the issuer.
    await enableAccountFlag(issuer, ASF_ALLOW_TRUSTLINE_CLAWBACK);
    await enableAccountFlag(issuer, ASF_DEFAULT_RIPPLE);
    await setTransferRate(issuer, TRANSFER_RATE);
    await openTrustLine(secondHolder, { currency: "USD", issuer: issuer.address, limit: "1000" });

    const { currencyBridge, accountBridge } = await getBridges(buildXrpSigner(holder));
    const account = makeXrpAccount(holder.address);
    const tokens = {
      usd: makeIouToken("USD", issuer.address),
      usdLower: makeIouToken("usd", issuer.address),
      eur: makeIouToken("EUR", issuer.address),
    };
    installTokenStore(Object.values(tokens));
    steps = makeSteps(account, tokens);
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

  afterAll: async account => {
    expect(
      account.subAccounts?.map(sub => [sub.token.ticker, sub.balance.toFixed()]),
    ).toStrictEqual([["USD", "0"]]);
    expect((await getLine("USD"))?.balance).toBe("0");

    const rowsOf = (type: OperationType) => account.operations.filter(op => op.type === type);
    expect(rowsOf("OPT_IN")).toHaveLength(3);
    expect(rowsOf("OPT_EDIT")).toHaveLength(3);
    expect(rowsOf("OPT_OUT")).toHaveLength(2);

    const funding = new BigNumber(FUNDING_XRP).shiftedBy(6);
    expect(account.balance).toStrictEqual(funding.minus(getFeesPaid(account)));
  },

  teardown: async () => {
    closeGuard?.();
    await sandbox?.down();
    sandbox = undefined;
  },
};
