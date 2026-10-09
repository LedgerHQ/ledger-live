import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import BigNumber from "bignumber.js";
import { createTransaction } from "../../bridge/generic-coin-framework/createTransaction";

describe("algorand on the generic coin framework", () => {
  it("creates a transaction signable without an account sequence", () => {
    const account = genAccount("algorand", { currency: getCryptoCurrencyById("algorand") });

    expect(createTransaction(account).nonce).toEqual(new BigNumber(0));
  });
});
