import BigNumber from "bignumber.js";
import { decodeFundPayload } from "@ledgerhq/hw-app-exchange";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { buildCardFundTransaction } from "../buildCardFundTransaction";

jest.mock("@ledgerhq/hw-app-exchange", () => ({
  decodeFundPayload: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(decodeFundPayload).mockResolvedValue({
    userId: "card-user",
    accountName: "Card",
    inCurrency: "XRP",
    inAddress: "destination",
    inAmount: new Uint8Array(),
    deviceTransactionId: new Uint8Array(),
    inExtraId: "123",
  });
});

it.each([
  ["bitcoin", "bitcoin"],
  ["litecoin", "bitcoin"],
  ["ethereum", "evm"],
  ["ripple", "xrp"],
  ["solana", "solana"],
] as const)(
  "builds the %s Card Fund transaction through its %s strategy",
  async (currencyId, family) => {
    const account = genAccount(`${currencyId}-account`, {
      currency: getCryptoCurrencyById(currencyId),
      operationsSize: 0,
    });

    const transaction = await buildCardFundTransaction({
      account,
      amount: new BigNumber(10),
      payinAddress: "destination",
      binaryPayload: "payload",
    });

    expect(transaction).toMatchObject({
      family,
      amount: new BigNumber(10),
      recipient: "destination",
    });
  },
);

it("builds token funding on the parent EVM family", async () => {
  const parentAccount = genAccount("ethereum-account", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 0,
  });
  const account = genTokenAccount(0, parentAccount, usdcToken);

  const transaction = await buildCardFundTransaction({
    account,
    parentAccount,
    amount: new BigNumber(10),
    payinAddress: "destination",
    binaryPayload: "payload",
  });

  expect(transaction).toMatchObject({
    family: "evm",
    subAccountId: account.id,
  });
});
