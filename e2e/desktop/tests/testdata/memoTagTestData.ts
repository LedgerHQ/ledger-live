import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export type MemoTagSendFlowType = "modal" | "stellar";

export interface MemoTagCoinTestData {
  coin: string;
  fromAccount: Account;
  toAccount: Account;
  recipientAddress: string;
  userdata: string;
  testValue: string;
  testAmount: string;
  tagFieldName?: string;
  sendFlowType?: MemoTagSendFlowType;
}

export const memoTagCoinTestData: MemoTagCoinTestData[] = [
  {
    coin: "HBAR",
    fromAccount: Account.HEDERA_1,
    toAccount: Account.HEDERA_2,
    recipientAddress: "0.0.7654321",
    userdata: "memo-tag-assets",
    testValue: "7654321",
    testAmount: "0.1",
  },
  {
    coin: "ATOM",
    fromAccount: Account.ATOM_1,
    toAccount: Account.ATOM_2,
    recipientAddress: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5",
    userdata: "speculos-tests-app",
    testValue: "7654321",
    testAmount: "0.1",
  },
  {
    coin: "XRP",
    fromAccount: Account.XRP_1,
    toAccount: Account.XRP_2,
    recipientAddress: "r4UCbAuAQNBu1HFo9Py6vNHNjKB449cWLp",
    userdata: "speculos-tests-app",
    testValue: "1234567890",
    testAmount: "1",
  },
  {
    coin: "SOL",
    fromAccount: Account.SOL_1,
    toAccount: Account.SOL_2,
    recipientAddress: "6G9JukAUkngsKKjsnzaFPxC5Ysw2f8Je1YGYdqffuAYa",
    userdata: "speculos-tests-app",
    testValue: "Exchange-Deposit-12345",
    testAmount: "0.1",
  },
  {
    coin: "XLM",
    fromAccount: Account.XLM_1,
    toAccount: Account.XLM_2,
    recipientAddress: "GBGFRCYP52ZHEBCIVA7I2Q4CKRABAJNY2UQDNAXUH6SZPJQQCBUFEE5Q",
    userdata: "speculos-subAccount",
    testValue: "7654321",
    testAmount: "0.1",
    sendFlowType: "stellar",
  },
  {
    coin: "ADA",
    fromAccount: Account.ADA_2,
    toAccount: Account.ADA_1,
    recipientAddress:
      "addr1qxvr8q57aavyay5yr4x9p2lne638tc7xeagm8fxz9rgu86gqucmu0k5rsc07x578az7h9ajg5djag7qtnhez3euuhqmquwuqwv",
    userdata: "memo-tag-assets",
    testValue: "839201",
    testAmount: "1",
  },
];
