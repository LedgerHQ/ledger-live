import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, SubAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { BitcoinAccount } from "../families/bitcoin/types";
import {
  BandwidthInfo,
  TronAccount,
  TronResources,
} from "../families/tron/types";
import { isAccountEmpty, clearAccount } from "./helpers";

const mockAccount = {} as Account;

describe(isAccountEmpty.name, () => {
  describe("given a Tron account", () => {
    let tronAccount: TronAccount;
    beforeEach(() => {
      tronAccount = mockAccount as TronAccount;
      tronAccount.type = "Account";
      tronAccount.currency = { family: "tron" } as CryptoCurrency;
    });
    describe("when account as no ressources", () => {
      beforeEach(() => {
        tronAccount.tronResources = {
          bandwidth: {
            freeLimit: new BigNumber(0),
          } as BandwidthInfo,
        } as TronResources;
      });

      it("should return true", () => {
        expect(isAccountEmpty(tronAccount)).toEqual(true);
      });
    });
    describe("when account has resources", () => {
      beforeEach(() => {
        tronAccount.tronResources = {
          bandwidth: {
            freeLimit: new BigNumber(42),
          } as BandwidthInfo,
        } as TronResources;
      });

      it("should return false", () => {
        expect(isAccountEmpty(tronAccount)).toEqual(false);
      });
    });
  });
});

describe(clearAccount.name, () => {
  describe("given an Account", () => {
    const ethereumCurrency = {
      family: "ethereum",
    } as CryptoCurrency;
    const withSubAccounts = {
      ...mockAccount,
      subAccounts: [
        {
          currency: ethereumCurrency,
        } as SubAccount,
      ],
      currency: ethereumCurrency,
    };

    describe("when it is a tron account", () => {
      beforeEach(() => {
        const tronCurrency = {
          family: "tron",
        } as CryptoCurrency;
        withSubAccounts.currency = tronCurrency;
      });

      it("should reset tronResources cache", () => {
        const clearedAccount = clearAccount(withSubAccounts) as TronAccount;
        expect(
          Object.keys(clearedAccount.tronResources.cacheTransactionInfoById)
            .length
        ).toEqual(0);
      });
    });

    describe("when it is a bitcoin account", () => {
      beforeEach(() => {
        const btcCurrency = {
          family: "bitcoin",
        } as CryptoCurrency;
        withSubAccounts.currency = btcCurrency;
      });

      it("should reset bitcoinResources", () => {
        const clearedAccount = clearAccount(withSubAccounts) as BitcoinAccount;
        expect(clearedAccount.bitcoinResources.utxos.length).toEqual(0);
      });
    });
  });
});
