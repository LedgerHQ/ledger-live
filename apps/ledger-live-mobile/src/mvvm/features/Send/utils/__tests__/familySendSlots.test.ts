import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { ALEO_ACCOUNT_1 } from "~/families/aleo/__mocks__/account.mock";
import { getSendBalanceTypeSync, isSendBalanceTypeSyncRequired } from "../familySendSlots";

const BTC_ACCOUNT = genAccount("family-send-slots-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const bitcoinTransaction = { family: "bitcoin" } as Transaction;

const aleoPublicTransaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
} as Transaction;

const aleoPrivateTransaction = {
  ...aleoPublicTransaction,
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  properties: { amountRecordCommitments: [], feeRecordCommitment: null },
} as Transaction;

describe("familySendSlots", () => {
  it.each([undefined, "bitcoin", "toString"])(
    "GIVEN the family %s without a sync slot WHEN resolved THEN no slot is returned",
    family => {
      expect(getSendBalanceTypeSync(family)).toBeUndefined();
    },
  );

  it("GIVEN the aleo family WHEN resolved THEN its sync slot is returned", () => {
    expect(getSendBalanceTypeSync("aleo")).toBeDefined();
  });

  it("GIVEN a family without a sync slot WHEN checked THEN no sync is required", () => {
    expect(isSendBalanceTypeSyncRequired(BTC_ACCOUNT, bitcoinTransaction)).toBe(false);
  });

  it("GIVEN no transaction WHEN checked THEN no sync is required", () => {
    expect(isSendBalanceTypeSyncRequired(ALEO_ACCOUNT_1, null)).toBe(false);
  });

  it.each([
    ["public", aleoPublicTransaction, false],
    ["private", aleoPrivateTransaction, true],
  ])(
    "GIVEN an aleo %s transaction WHEN checked THEN the family slot decides",
    (_, transaction, expected) => {
      expect(isSendBalanceTypeSyncRequired(ALEO_ACCOUNT_1, transaction)).toBe(expected);
    },
  );
});
