import BigNumber from "bignumber.js";
import aleoConfig from "../config";
import {
  getMockedAccount,
  getMockedTokenAccount,
  mockAleoResources,
  mockUnspentRecord1,
  mockUnspentRecord2,
  mockUnspentTokenRecord1,
  mockUnspentTokenRecord2,
} from "../__tests__/fixtures/account.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { aleoAccountBalances } from "./accountBalances";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import type { AleoAccount } from "../types";

jest.mock("../config");

const FEE = 34060;
const PUBLIC_BALANCE = 1_000_000;
const TOKEN_PUBLIC_BALANCE = 450_000;
const PRIVATE_RECORDS = 800_000 + 600_000;
// Without fee sponsoring, the 600,000 record is set aside to pay the fee of a private native send.
const PRIVATE_MAX_WITH_FEE_RECORD = 800_000;

/** The account with the balance rows a sync would give it and its token. */
function withRows(account: AleoAccount): AleoAccount {
  const { account: rows, tokens = {} } = aleoAccountBalances(account);
  return {
    ...account,
    ...(rows && { balances: rows }),
    subAccounts: (account.subAccounts ?? []).map(sub => {
      const tokenRows = tokens[sub.id];
      return tokenRows ? { ...sub, balances: tokenRows } : sub;
    }),
  };
}

// Real prepareTransaction, so the figure a filter selects is the one the send flow would compute.
describe("estimateMaxSpendable with the private filter, through prepareTransaction", () => {
  const account = withRows(
    getMockedAccount({
      subAccounts: [
        getMockedTokenAccount(undefined, {
          transparentBalance: new BigNumber(TOKEN_PUBLIC_BALANCE),
          privateBalance: new BigNumber(PRIVATE_RECORDS),
          unspentPrivateRecords: [mockUnspentTokenRecord1, mockUnspentTokenRecord2],
        }),
      ],
      aleoResources: {
        ...mockAleoResources,
        transparentBalance: new BigNumber(PUBLIC_BALANCE),
        privateBalance: new BigNumber(PRIVATE_RECORDS),
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
      },
    }),
  );
  const token = account.subAccounts![0];

  beforeEach(() => {
    jest.mocked(aleoConfig).getCoinConfig.mockReturnValue({
      ...getMockedConfig("mainnet"),
      isFeeSponsored: false,
      recordPickingStrategy: "auto",
    });
  });

  it("is the transparent balance net of the fee with private: false", async () => {
    expect(await estimateMaxSpendable({ account, filters: { private: false } })).toEqual(
      new BigNumber(PUBLIC_BALANCE - FEE),
    );
  });

  it("keeps a record for the fee with private: true", async () => {
    expect(await estimateMaxSpendable({ account, filters: { private: true } })).toEqual(
      new BigNumber(PRIVATE_MAX_WITH_FEE_RECORD),
    );
  });

  it("is the sum of the private records with private: true when the fee is sponsored", async () => {
    jest.mocked(aleoConfig).getCoinConfig.mockReturnValue({
      ...getMockedConfig("mainnet"),
      isFeeSponsored: true,
      recordPickingStrategy: "auto",
    });

    expect(await estimateMaxSpendable({ account, filters: { private: true } })).toEqual(
      new BigNumber(PRIVATE_RECORDS),
    );
  });

  it("is zero with private: true when no record covers the fee", async () => {
    const tiny = withRows(
      getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          privateBalance: new BigNumber(1),
          unspentPrivateRecords: [{ ...mockUnspentRecord1, microcredits: "1" }],
        },
      }),
    );

    expect(await estimateMaxSpendable({ account: tiny, filters: { private: true } })).toEqual(
      new BigNumber(0),
    );
  });

  it("is the transparent token balance without filters on a token account", async () => {
    expect(
      await estimateMaxSpendable({
        account: token,
        parentAccount: account,
      }),
    ).toEqual(new BigNumber(TOKEN_PUBLIC_BALANCE));
  });

  it("is the transparent token balance with private: false on a token account", async () => {
    expect(
      await estimateMaxSpendable({
        account: token,
        parentAccount: account,
        filters: { private: false },
      }),
    ).toEqual(new BigNumber(TOKEN_PUBLIC_BALANCE));
  });

  it("is the sum of the token's private records with private: true on a token account", async () => {
    expect(
      await estimateMaxSpendable({
        account: token,
        parentAccount: account,
        filters: { private: true },
      }),
    ).toEqual(new BigNumber(PRIVATE_RECORDS));
  });

  it("estimates the same private max with the manual record picking strategy", async () => {
    jest.mocked(aleoConfig).getCoinConfig.mockReturnValue({
      ...getMockedConfig("mainnet"),
      isFeeSponsored: false,
      recordPickingStrategy: "manual",
    });

    expect(await estimateMaxSpendable({ account, filters: { private: true } })).toEqual(
      new BigNumber(PRIVATE_MAX_WITH_FEE_RECORD),
    );
  });

  it("stays within what a pending public send leaves on the public row", async () => {
    const pendingSend = {
      type: "OUT",
      value: new BigNumber(300_000),
      fee: new BigNumber(FEE),
      extra: { transactionType: "public" },
    };
    const busy = withRows({ ...account, pendingOperations: [pendingSend] } as AleoAccount);

    // 1,000,000 minus the pending 300,000 and its fee, minus the fee of the new send.
    expect(await estimateMaxSpendable({ account: busy, filters: { private: false } })).toEqual(
      new BigNumber(PUBLIC_BALANCE - 300_000 - FEE - FEE),
    );
    // The private records are not touched by a public send.
    expect(await estimateMaxSpendable({ account: busy, filters: { private: true } })).toEqual(
      new BigNumber(PRIVATE_MAX_WITH_FEE_RECORD),
    );
  });

  it("is zero when pending operations lock the whole selected row", async () => {
    const pendingSend = {
      type: "OUT",
      value: new BigNumber(PUBLIC_BALANCE),
      fee: new BigNumber(0),
      extra: { transactionType: "public" },
    };
    const busy = withRows({ ...account, pendingOperations: [pendingSend] } as AleoAccount);

    expect(await estimateMaxSpendable({ account: busy, filters: { private: false } })).toEqual(
      new BigNumber(0),
    );
  });
});
