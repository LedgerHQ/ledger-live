import { getAccountBannerState } from "./banner";
import * as preloadedData from "./preloadedData";
import * as logic from "./logic";
import type { CosmosAccount, CosmosValidatorItem } from "./types";
import data from "./preloadedData.mock";
import { LEDGER_VALIDATOR_ADDRESS } from "./utils";
import { BigNumber } from "bignumber.js";

jest.mock("./js-prepareTransaction", () => ({
  calculateFees: jest.fn(() => Promise.resolve({})),
}));

const ledgerValidator: CosmosValidatorItem | undefined = data.validators.find(
  (x) => x.validatorAddress === LEDGER_VALIDATOR_ADDRESS
);
const expensiveValidator: CosmosValidatorItem | undefined =
  data.validators.find(
    (x) =>
      x.validatorAddress ===
      "cosmosvaloper1qs8tnw2t8l6amtzvdemnnsq9dzk0ag0z52uzay"
  );
const cheapValidator: CosmosValidatorItem | undefined = data.validators.find(
  (x) =>
    x.validatorAddress ===
    "cosmosvaloper1qaa9zej9a0ge3ugpx3pxyx602lxh3ztqgfnp42"
);

const account: CosmosAccount = {
  type: "Account",
  id: "js:2:cosmos:cosmos1f9y7wdychcdhwvyrhff3zvs3gy3qxcu2th4g8u:",
  starred: false,
  used: false,
  seedIdentifier:
    "02d4c121ce2bb160ebf39aa0be0050b4d553e18872985ac3a4e21904fd1442defe",
  derivationMode: "",
  index: 1,
  freshAddress: "cosmos1f9y7wdychcdhwvyrhff3zvs3gy3qxcu2th4g8u",
  freshAddressPath: "44'/118'/1'/0/0",
  name: "Cosmos 2 - Nano X Static Account",
  freshAddresses: [],
  blockHeight: 5417472,
  creationDate: new Date("2022-08-02T16:09:08.906Z"),
  balance: new BigNumber("200250"),
  spendableBalance: new BigNumber("200250"),
  operations: [],
  operationsCount: 1,
  pendingOperations: [],
  unit: { name: "Atom", code: "ATOM", magnitude: 6 },
  currency: {
    type: "CryptoCurrency",
    id: "cosmos",
    coinType: 118,
    name: "Cosmos",
    managerAppName: "Cosmos",
    ticker: "ATOM",
    scheme: "cosmos",
    color: "#16192f",
    family: "cosmos",
    units: [
      { name: "Atom", code: "ATOM", magnitude: 6 },
      { name: "microAtom", code: "uatom", magnitude: 0 },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/cosmos/txs/$hash",
        address: "https://www.mintscan.io/cosmos/validators/$address",
      },
    ],
  },
  lastSyncDate: new Date("2022-08-02T16:11:47.343Z"),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: { balances: [0, 393248, 393248], latestDate: 1661162400000 },
    DAY: { balances: [0, 393248], latestDate: 1661122800000 },
    WEEK: { balances: [0, 393248], latestDate: 1661036400000 },
  },
  xpub: "cosmos1f9y7wdychcdhwvyrhff3zvs3gy3qxcu2th4g8u",
  cosmosResources: {
    delegations: [
      {
        amount: new BigNumber("50000"),
        status: "bonded",
        pendingRewards: new BigNumber("112"),
        validatorAddress:
          "cosmosvaloper1c4k24jzduc365kywrsvf5ujz4ya6mwympnc4en",
      },
    ],
    redelegations: [],
    unbondings: [],
    delegatedBalance: new BigNumber("0"),
    pendingRewardsBalance: new BigNumber("0"),
    unbondingBalance: new BigNumber("0"),
    withdrawAddress: "",
  },
};

const validators = [expensiveValidator, cheapValidator, ledgerValidator];

describe("cosmos/banner", () => {
  describe("useCosmosFormattedDelegations", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("should not display the banner", async () => {
      jest
        .spyOn(preloadedData, "getCurrentCosmosPreloadData")
        .mockReturnValue({ validators } as {
          validators: CosmosValidatorItem[];
        });
      jest.spyOn(logic, "canDelegate").mockReturnValue(false);
      jest.spyOn(logic, "canRedelegate").mockReturnValue(false);
      const result = getAccountBannerState(account);
      expect(result).toStrictEqual({
        display: false,
        redelegate: false,
        validatorSrcAddress: "",
        ledgerValidator,
      });
    });
    it("should return display delegate mode", async () => {
      jest
        .spyOn(preloadedData, "getCurrentCosmosPreloadData")
        .mockReturnValue({ validators } as {
          validators: CosmosValidatorItem[];
        });
      jest.spyOn(logic, "canDelegate").mockReturnValue(true);
      jest.spyOn(logic, "canRedelegate").mockReturnValue(false);
      const result = getAccountBannerState(account);
      expect(result).toStrictEqual({
        display: true,
        redelegate: false,
        validatorSrcAddress: "",
        ledgerValidator,
      });
    });
    it("should return display redelegate mode", async () => {
      jest
        .spyOn(preloadedData, "getCurrentCosmosPreloadData")
        .mockReturnValue({ validators } as {
          validators: CosmosValidatorItem[];
        });
      jest.spyOn(logic, "canDelegate").mockReturnValue(false);
      jest.spyOn(logic, "canRedelegate").mockReturnValue(true);
      account.cosmosResources.redelegations.push({
        validatorSrcAddress: "xxxx",
        validatorDstAddress: expensiveValidator?.validatorAddress as string,
        amount: new BigNumber(1000),
        completionDate: new Date(),
      });
      const accountWithSpendable5000 = {
        ...account,
        spendableBalance: new BigNumber(5000),
      };
      const result = getAccountBannerState(accountWithSpendable5000);
      expect(result).toStrictEqual({
        display: true,
        redelegate: true,
        validatorSrcAddress: expensiveValidator?.validatorAddress,
        ledgerValidator,
      });
    });
    it("should return not display redelegate mode", async () => {
      jest
        .spyOn(preloadedData, "getCurrentCosmosPreloadData")
        .mockReturnValue({ validators } as {
          validators: CosmosValidatorItem[];
        });
      jest.spyOn(logic, "canDelegate").mockReturnValue(false);
      jest.spyOn(logic, "canRedelegate").mockReturnValue(false);
      account.cosmosResources.redelegations.push({
        validatorSrcAddress: "xxxx",
        validatorDstAddress: expensiveValidator?.validatorAddress as string,
        amount: new BigNumber(1000),
        completionDate: new Date(),
      });
      const result = getAccountBannerState(account);
      expect(result).toStrictEqual({
        display: false,
        redelegate: false,
        validatorSrcAddress: "",
        ledgerValidator,
      });
    });
  });
});
