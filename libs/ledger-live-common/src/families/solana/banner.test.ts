import { getAccountBannerState } from "./banner";
import * as preloadedData from "./js-preload-data";
import * as helpers from "../../account/helpers";
import type { SolanaAccount, SolanaPreloadDataV1, SolanaStake } from "./types";

import { BigNumber } from "bignumber.js";
import { ValidatorsAppValidator } from "./validator-app";

const ledgerValidator: ValidatorsAppValidator = {
  activeStake: 2030500428402855,
  commission: 7,
  totalScore: 10,
  voteAccount: "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx",
  name: "Ledger by Figment",
  avatarUrl:
    "https://s3.amazonaws.com/keybase_processed_uploads/3c47b62f3d28ecfd821536f69be82905_360_360.jpg",
  wwwUrl: "https://www.ledger.com/staking",
};
//
const expensiveValidator: ValidatorsAppValidator = {
  activeStake: 2364997398255144,
  commission: 11,
  totalScore: 11,
  voteAccount: "3CnKZPQn92W8WXG7KTVaFQRk8LJJ3KZbrVVF4ngUxqkg",
  name: "Block Logic +MEV +Triton",
  avatarUrl:
    "https://s3.amazonaws.com/keybase_processed_uploads/3af995d21a8fe4cec4d6e83104f87205_360_360.jpg",
  wwwUrl: "https://www.blocklogic.net",
};

const cheapValidator: ValidatorsAppValidator = {
  activeStake: 2025259097741698,
  commission: 6,
  totalScore: 11,
  voteAccount: "CogentC52e7kktFfWHwsqSmr8LiS1yAtfqhHcftCPcBJ",
  name: "Cogent Crypto ⚙️ CogentCrypto.io",
  avatarUrl:
    "https://s3.amazonaws.com/keybase_processed_uploads/101f5c1f799564869ae435ea9de40d05_360_360.jpg",
  wwwUrl: "https://CogentCrypto.io",
};

const account: SolanaAccount = {
  type: "Account",
  id: "js:2:solana:8Qs1nzggCjEYhFcj4yHwiS5s3QzNeCPWpQnntFdwUYhN:solanaSub",
  starred: false,
  used: false,
  seedIdentifier: "5gaQapKG9MpAWMLtZFoDqzmKfxMN2FXDVNAKiGFaMXGg",
  derivationMode: "solanaSub",
  index: 0,
  freshAddress: "8Qs1nzggCjEYhFcj4yHwiS5s3QzNeCPWpQnntFdwUYhN",
  freshAddressPath: "44'/501'/0'",
  freshAddresses: [],
  name: "Solana 1",
  blockHeight: 177035578,
  creationDate: new Date("2023-02-08T12:57:45.000Z"),
  balance: new BigNumber("606150870"),
  spendableBalance: new BigNumber("203867990"),
  operations: [],
  operationsCount: 2,
  pendingOperations: [],
  unit: { name: "SOL", code: "SOL", magnitude: 9 },
  currency: {
    type: "CryptoCurrency",
    id: "solana",
    coinType: 501,
    name: "Solana",
    managerAppName: "Solana",
    ticker: "SOL",
    scheme: "solana",
    color: "#000",
    family: "solana",
    units: [],
    explorerViews: [],
    keywords: ["sol", "solana"],
  },
  lastSyncDate: new Date("2023-02-10T12:26:25.152Z"),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: {
      balances: [],
      latestDate: 1676030400000,
    },
    DAY: {
      balances: [],
      latestDate: 1675987200000,
    },
    WEEK: { balances: [402282880], latestDate: 1675555200000 },
  },
  solanaResources: {
    stakes: [
      {
        stakeAccAddr: "HxMXhn5EWivZ2R4EWCKMXuhhm1Fi82FijFvHXuhVLRhX",
        stakeAccBalance: 402282880,
        rentExemptReserve: 2282880,
        hasStakeAuth: true,
        hasWithdrawAuth: true,
        delegation: {
          stake: 400000000,
          voteAccAddr: "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx",
        },
        activation: { active: 0, inactive: 400000000, state: "activating" },
        withdrawable: 0,
      },
    ],
  },
};

const validators = [expensiveValidator, cheapValidator, ledgerValidator];
const validatorsMap = {
  version: "1",
  validatorsWithMeta: [],
  validators,
} as SolanaPreloadDataV1;

describe("solana/banner", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("should not display the banner is account is", async () => {
    jest
      .spyOn(preloadedData, "getCurrentSolanaPreloadData")
      .mockReturnValue(validatorsMap);
    jest.spyOn(helpers, "isAccountEmpty").mockReturnValue(true);
    const result = getAccountBannerState(account);
    expect(result).toStrictEqual({
      display: false,
      redelegate: false,
      stakeAccAddr: "",
      ledgerValidator,
    });
  });
  it("should return display delegate mode is account is not empty", async () => {
    jest
      .spyOn(preloadedData, "getCurrentSolanaPreloadData")
      .mockReturnValue(validatorsMap);
    jest.spyOn(helpers, "isAccountEmpty").mockReturnValue(false);
    const result = getAccountBannerState(account);
    expect(result).toStrictEqual({
      display: true,
      redelegate: false,
      stakeAccAddr: "",
      ledgerValidator,
    });
  });
  it("should return display redelegate mode when deactive is an action", async () => {
    const badValidator: SolanaStake = {
      stakeAccAddr: "4hCKLnHHoFVtGcYSSV9K63pcnwvEfYzFb1vBAzfBGxBk",
      stakeAccBalance: 52282880,
      rentExemptReserve: 2282880,
      hasStakeAuth: true,
      hasWithdrawAuth: true,
      delegation: {
        stake: 50000000,
        voteAccAddr: "3CnKZPQn92W8WXG7KTVaFQRk8LJJ3KZbrVVF4ngUxqkg",
      },
      activation: { active: 0, inactive: 50000000, state: "activating" },
      withdrawable: 0,
    };
    jest
      .spyOn(preloadedData, "getCurrentSolanaPreloadData")
      .mockReturnValue(validatorsMap);
    jest.spyOn(helpers, "isAccountEmpty").mockReturnValue(false);
    account.solanaResources?.stakes.push(badValidator);
    const result = getAccountBannerState(account);
    expect(result).toStrictEqual({
      display: true,
      redelegate: true,
      stakeAccAddr: "4hCKLnHHoFVtGcYSSV9K63pcnwvEfYzFb1vBAzfBGxBk",
      ledgerValidator,
    });
  });
});
