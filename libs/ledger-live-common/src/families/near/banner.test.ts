import { getAccountBannerState } from "./banner";
import * as preloadedData from "./preload";
import * as logic from "./logic";

import { BigNumber } from "bignumber.js";
import type { NearAccount, NearValidatorItem } from "./types";
import type { NearStakingPosition } from "./api/sdk.types";

const ledgerValidator: NearValidatorItem = {
  validatorAddress: "ledgerbyfigment.poolv1.near",
  tokens: "1048915930081658334880682687527",
  commission: 0.05,
};

const expensiveValidator: NearValidatorItem = {
  validatorAddress: "vcap.poolv1.near",
  tokens: "25189185052249274302209542299",
  commission: 0.1,
};

const cheapValidator: NearValidatorItem = {
  validatorAddress: "meduza.poolv1.near",
  tokens: "25456182690919428871460833604",
  commission: 0.02,
};

const account: NearAccount = {
  type: "Account",
  id: "js:2:near:d812a582d0b30c1a13041fd564e5f0c4325804b1dd2447d63ab6b9a424747363:nearbip44h",
  starred: false,
  used: true,
  seedIdentifier: "ed25519:DewDMzsc2cnMYBrALESrf3vKWLp3zBB4HJnPoyvPL945",
  derivationMode: "nearbip44h",
  index: 1,
  freshAddress:
    "d812a582d0b30c1a13041fd564e5f0c4325804b1dd2447d63ab6b9a424747363",
  freshAddressPath: "44'/397'/0'/0'/1'",
  freshAddresses: [],
  name: "NEAR 2",
  blockHeight: 85373729,
  creationDate: new Date("2022-12-08T09:42:54.396Z"),
  balance: new BigNumber("3.10368633212077468946995e+23"),
  spendableBalance: new BigNumber("1.265872509685649e+23"),
  operations: [],
  operationsCount: 3,
  pendingOperations: [],
  unit: { name: "NEAR", code: "NEAR", magnitude: 24 },
  currency: {
    type: "CryptoCurrency",
    id: "near",
    coinType: 397,
    name: "NEAR",
    managerAppName: "NEAR",
    ticker: "NEAR",
    scheme: "near",
    color: "#000",
    family: "near",
    units: [],
    explorerViews: [],
    keywords: ["near"],
  },
  lastSyncDate: new Date("2023-02-16T19:43:17.615Z"),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: {
      balances: [],
      latestDate: 1676574000000,
    },
    DAY: {
      balances: [],
      latestDate: 1676505600000,
    },
    WEEK: {
      balances: [],
      latestDate: 1676160000000,
    },
  },
  nearResources: {
    stakedBalance: new BigNumber("1.29802125309300073830514e+23"),
    pendingBalance: new BigNumber("0"),
    availableBalance: new BigNumber("0"),
    storageUsageBalance: new BigNumber("5.182e+22"),
    stakingPositions: [],
  },
};

const validators = [expensiveValidator, cheapValidator, ledgerValidator];
const validatorsMap = {
  storageCost: new BigNumber("10000000000000000000"),
  gasPrice: new BigNumber("100000000"),
  createAccountCostSend: new BigNumber("99607375000"),
  createAccountCostExecution: new BigNumber("99607375000"),
  transferCostSend: new BigNumber("115123062500"),
  transferCostExecution: new BigNumber("115123062500"),
  addKeyCostSend: new BigNumber("101765125000"),
  addKeyCostExecution: new BigNumber("101765125000"),
  receiptCreationSend: new BigNumber("108059500000"),
  receiptCreationExecution: new BigNumber("108059500000"),
  validators,
};

describe("near/banner", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("should not display the banner is account is", async () => {
    jest
      .spyOn(preloadedData, "getCurrentNearPreloadData")
      .mockReturnValue(validatorsMap);
    jest.spyOn(logic, "canStake").mockReturnValue(false);
    const result = getAccountBannerState(account);
    expect(result).toStrictEqual({
      display: false,
      redelegate: false,
      validatorId: "",
      ledgerValidator,
    });
  });
  it("should return display delegate mode is account is not empty", async () => {
    jest
      .spyOn(preloadedData, "getCurrentNearPreloadData")
      .mockReturnValue(validatorsMap);
    jest.spyOn(logic, "canUnstake").mockReturnValue(true);
    const result = getAccountBannerState(account);
    expect(result).toStrictEqual({
      display: true,
      redelegate: false,
      validatorId: "",
      ledgerValidator,
    });
  });
  it("should return display redelegate mode when deactive is an action", async () => {
    const badValidator: NearStakingPosition = {
      staked: new BigNumber("1.29802125309300073830514e+23"),
      available: new BigNumber("1"),
      pending: new BigNumber("0"),
      rewards: new BigNumber("1.462125309300073830515e+21"),
      validatorId: "vcap.poolv1.near",
    };
    jest
      .spyOn(preloadedData, "getCurrentNearPreloadData")
      .mockReturnValue(validatorsMap);
    account.nearResources?.stakingPositions.push(badValidator);
    const result = getAccountBannerState(account);
    expect(result).toStrictEqual({
      display: true,
      redelegate: true,
      validatorId: "vcap.poolv1.near",
      ledgerValidator,
    });
  });
});
