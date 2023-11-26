import network from "@ledgerhq/live-network/network";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import * as jsPrepareTransaction from "./js-prepareTransaction";
import { calculateFees, getEstimatedFees } from "./js-prepareTransaction";
import { CosmosAccount, Transaction } from "./types";
jest.mock("@ledgerhq/live-network/network");

const account = {
  id: "accountId",
  currency: { id: "cosmos", units: [{}, { code: "atom" }] },
  spendableBalance: new BigNumber("1000000000"),
  seedIdentifier: "seedIdentifier",
} as CosmosAccount;
const transaction = {
  mode: "send",
  recipient: "cosmosrecipientaddress",
  amount: new BigNumber("1000000"),
  memo: "test memo",
  useAllAmount: false,
} as unknown as Transaction;

describe("getEstimatedFees", () => {
  it("should return gas higher than estimate", async () => {
    const gasSimulationMock = 42000;
    // @ts-expect-error method is mocked
    network.mockResolvedValue({
      data: {
        gas_info: {
          gas_used: gasSimulationMock,
        },
      },
    });
    const { gasWanted } = await getEstimatedFees(account, transaction);
    expect(gasWanted.gt(new BigNumber(gasSimulationMock))).toEqual(true);
  });

  it("should calculate fees for a transaction", async () => {
    // @ts-expect-error method is mocked
    network.mockResolvedValue({
      data: {
        gas_info: {
          gas_used: 42000,
        },
      },
    });
    const { gasWantedFees, gasWanted } = await getEstimatedFees(account, transaction);
    expect(gasWantedFees.gt(0)).toEqual(true);
    expect(gasWanted.gt(0)).toEqual(true);
  });
});

describe("calculateFees", () => {
  let getEstimatedFeesSpy: jest.SpyInstance;

  beforeEach(() => {
    getEstimatedFeesSpy = jest.spyOn(jsPrepareTransaction, "getEstimatedFees").mockImplementation();
  });

  afterEach(() => {
    // Reset LRU cache
    calculateFees.reset();
    // Reset spy
    jest.resetAllMocks();
  });

  it("should not estimate fees again if account and transaction didn't change", async () => {
    await calculateFees({ account, transaction });
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(1);
  });

  it("should estimate fees again if account id changed", async () => {
    await calculateFees({ account, transaction });
    account.id = "i changed hehe";
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });

  it("should estimate fees again if account currency changed", async () => {
    await calculateFees({ account, transaction });
    account.currency.id = "i am a currency that changed hehe" as CryptoCurrencyId;
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });

  it("should estimate fees again if transaction amount changed", async () => {
    await calculateFees({ account, transaction });
    transaction.amount = new BigNumber(9000);
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });

  it("should estimate fees again if transaction recipient changed", async () => {
    await calculateFees({ account, transaction });
    transaction.recipient = "tasse";
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });

  it("should estimate fees again if transaction useAllAmount prop changed", async () => {
    await calculateFees({ account, transaction });
    transaction.useAllAmount = true;
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });

  it("should estimate fees again if transaction mode changed", async () => {
    await calculateFees({ account, transaction });
    transaction.mode = "delegate";
    transaction.validators = [{ address: "toto", amount: new BigNumber(1) }];
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });

  it("should estimate fees again if transaction validator address changed", async () => {
    transaction.mode = "delegate";
    transaction.validators = [{ address: "toto", amount: new BigNumber(1) }];
    await calculateFees({ account, transaction });
    transaction.mode = "delegate";
    transaction.validators = [{ address: "totoleretour", amount: new BigNumber(1) }];
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });

  it("should estimate fees again if transaction validator amount changed", async () => {
    transaction.mode = "delegate";
    transaction.validators = [{ address: "toto", amount: new BigNumber(1) }];
    await calculateFees({ account, transaction });
    transaction.mode = "delegate";
    transaction.validators = [{ address: "toto", amount: new BigNumber(2) }];
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });

  it("should estimate fees again if transaction memo changed", async () => {
    await calculateFees({ account, transaction });
    transaction.memo = "yikes";
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });

  it("should estimate fees again if transaction sourceValidator changed", async () => {
    await calculateFees({ account, transaction });
    transaction.sourceValidator = "source";
    await calculateFees({ account, transaction });
    expect(getEstimatedFeesSpy).toHaveBeenCalledTimes(2);
  });
});
