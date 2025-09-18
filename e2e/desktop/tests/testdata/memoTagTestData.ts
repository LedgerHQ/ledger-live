import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export interface MemoTagCoinTestData {
  coin: string;
  fromAccount: Account;
  toAccount: Account;
  testValue: string;
  testAmount: string;
  tagFieldName: string;
}

export const memoTagCoinTestData: MemoTagCoinTestData[] = [
  {
    coin: "XRP",
    fromAccount: Account.XRP_1,
    toAccount: Account.XRP_2,
    testValue: "1234567890",
    testAmount: "0.1",
    tagFieldName: "Memo",
  },
  {
    coin: "SOL",
    fromAccount: Account.SOL_1,
    toAccount: Account.SOL_2,
    testValue: "Exchange-Deposit-12345",
    testAmount: "0.1",
    tagFieldName: "Memo",
  },
  {
    coin: "ADA",
    fromAccount: Account.ADA_2,
    toAccount: Account.ADA_1,
    testValue: "839201",
    testAmount: "1",
    tagFieldName: "Memo",
  },
  {
    coin: "HBAR",
    fromAccount: Account.HBAR_1,
    toAccount: Account.HBAR_2,
    testValue: "7654321",
    testAmount: "0.1",
    tagFieldName: "Memo",
  },
];
