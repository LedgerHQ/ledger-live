import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { Account } from "@ledgerhq/types-live";
import { PredictionsAccountNotFound } from "@features/platform-predictions";
import { findPredictionsAccount } from "../signingRequests";

const account = {
  type: "Account",
  id: "js:2:polygon:0xabc:",
  freshAddress: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94",
  freshAddressPath: "44'/60'/0'/0/0",
  currency: { id: "polygon", family: "evm" },
} as Account;

describe("findPredictionsAccount", () => {
  beforeAll(() => {
    setWalletApiIdForAccountId(account.id);
  });

  it("finds the account behind the Wallet API account id", () => {
    expect(findPredictionsAccount([account], getWalletApiIdFromAccountId(account.id))).toBe(
      account,
    );
  });

  it("rejects an unknown account", () => {
    expect(() => findPredictionsAccount([account], "unknown")).toThrow(PredictionsAccountNotFound);
  });

  it("rejects an account that isn't EVM", () => {
    const bitcoinAccount = {
      ...account,
      id: "js:2:bitcoin:xpub:",
      currency: { id: "bitcoin", family: "bitcoin" },
    } as Account;
    setWalletApiIdForAccountId(bitcoinAccount.id);

    expect(() =>
      findPredictionsAccount([bitcoinAccount], getWalletApiIdFromAccountId(bitcoinAccount.id)),
    ).toThrow(PredictionsAccountNotFound);
  });
});
