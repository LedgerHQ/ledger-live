import BigNumber from "bignumber.js";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import {
  CryptoOrgAccount,
  CryptoOrgAccountRaw,
  CryptoOrgResourcesRaw,
} from "./types";

describe("assignToAccountRaw", () => {
  let accountMock: CryptoOrgAccount = {} as CryptoOrgAccount;
  let accountRawMock: CryptoOrgAccountRaw = {} as CryptoOrgAccountRaw;

  beforeEach(() => {
    accountMock = {} as CryptoOrgAccount;
    accountRawMock = {} as CryptoOrgAccountRaw;
  });

  describe("when cryptoOrgResources is defined", () => {
    it("should transfer data to accountRaw", () => {
      accountMock.cryptoOrgResources = {
        bondedBalance: new BigNumber(1),
        redelegatingBalance: new BigNumber(2),
        unbondingBalance: new BigNumber(3),
        commissions: new BigNumber(4),
      };
      assignToAccountRaw(accountMock, accountRawMock);
      expect(accountRawMock.cryptoOrgResources).not.toEqual(undefined);
    });

    it("should transfer account raw values correctly", () => {
      accountMock.cryptoOrgResources = {
        bondedBalance: new BigNumber(1),
        redelegatingBalance: new BigNumber(2),
        unbondingBalance: new BigNumber(3),
        commissions: new BigNumber(4),
      };
      assignToAccountRaw(accountMock, accountRawMock);
      expect(accountRawMock.cryptoOrgResources.bondedBalance).toEqual("1");
      expect(accountRawMock.cryptoOrgResources.redelegatingBalance).toEqual(
        "2"
      );
      expect(accountRawMock.cryptoOrgResources.unbondingBalance).toEqual("3");
      expect(accountRawMock.cryptoOrgResources.commissions).toEqual("4");
    });
  });

  describe("when cryptoOrgResources isn't defined", () => {
    it("shouldn't edit raw account", () => {
      assignToAccountRaw(accountMock, accountRawMock);
      expect(accountRawMock.cryptoOrgResources).toEqual(undefined);
    });
  });
});

describe("assignFromAccountRaw", () => {
  let accountMock: CryptoOrgAccount = {} as CryptoOrgAccount;
  let accountRawMock: CryptoOrgAccountRaw = {} as CryptoOrgAccountRaw;

  beforeEach(() => {
    accountMock = {} as CryptoOrgAccount;
    accountRawMock = {} as CryptoOrgAccountRaw;
  });

  describe("when cryptoOrgResources is defined", () => {
    it("should transfer data to account", () => {
      accountRawMock.cryptoOrgResources = {} as CryptoOrgResourcesRaw;
      assignFromAccountRaw(accountRawMock, accountMock);
      expect(accountMock.cryptoOrgResources).not.toEqual(undefined);
    });

    it("should convert data to account", () => {
      accountRawMock.cryptoOrgResources = {
        bondedBalance: "1",
        redelegatingBalance: "2",
        unbondingBalance: "3",
        commissions: "4",
      };
      assignFromAccountRaw(accountRawMock, accountMock);
      expect(accountMock.cryptoOrgResources.bondedBalance).toEqual(
        new BigNumber(1)
      );
      expect(accountMock.cryptoOrgResources.redelegatingBalance).toEqual(
        new BigNumber(2)
      );
      expect(accountMock.cryptoOrgResources.unbondingBalance).toEqual(
        new BigNumber(3)
      );
      expect(accountMock.cryptoOrgResources.commissions).toEqual(
        new BigNumber(4)
      );
    });
  });

  describe("when bitcoinResources isn't defined", () => {
    it("shouldn't edit raw account", () => {
      assignFromAccountRaw(accountRawMock, accountMock);
      expect(accountMock.cryptoOrgResources).toEqual(undefined);
    });
  });
});
