import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import cosmosCoinConfig, { cosmosConfig } from "./config";
import { calculateFees, getEstimatedFees } from "./prepareTransaction";
import { CosmosAccount, Transaction } from "./types";

jest.mock("@ledgerhq/live-network/network");

const networkMock = network as jest.Mock;

const account = {
  id: "accountId",
  freshAddress: "cosmos1testaddress",
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
  beforeAll(() => {
    LiveConfig.setConfig(cosmosConfig);
    cosmosCoinConfig.setCoinConfig(
      currency => LiveConfig.getValueByKey(`config_currency_${currency?.id}`) ?? {},
    );
  });

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
  beforeAll(() => {
    LiveConfig.setConfig(cosmosConfig);
    cosmosCoinConfig.setCoinConfig(
      currency => LiveConfig.getValueByKey(`config_currency_${currency?.id}`) ?? {},
    );
  });
  // Create fresh copies for each test to avoid cross-test pollution
  const createAccount = () =>
    ({
      id: "accountId",
      freshAddress: "cosmos1testaddress",
      currency: { id: "cosmos", units: [{}, { code: "atom" }] },
      spendableBalance: new BigNumber("1000000000"),
      seedIdentifier: "seedIdentifier",
    }) as CosmosAccount;

  const createTransaction = () =>
    ({
      mode: "send",
      recipient: "cosmosrecipientaddress",
      amount: new BigNumber("1000000"),
      memo: "test memo",
      useAllAmount: false,
    }) as unknown as Transaction;

  beforeEach(() => {
    networkMock.mockReset();
    networkMock.mockResolvedValue({
      data: { gas_info: { gas_used: 42000 } },
    });
    // Reset LRU cache before each test
    calculateFees.reset();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should not estimate fees again if account and transaction didn't change", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    await calculateFees({ account: acc, transaction: tx });
    // No new network calls should be made due to caching
    expect(networkMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("should estimate fees again if account id changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    acc.id = "i changed hehe";
    await calculateFees({ account: acc, transaction: tx });
    // New network calls should be made since cache key changed
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if account currency changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    acc.currency.id = "osmosis" as CryptoCurrencyId;
    await calculateFees({ account: acc, transaction: tx });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction amount changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    tx.amount = new BigNumber(9000);
    await calculateFees({ account: acc, transaction: tx });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction recipient changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    tx.recipient = "tasse";
    await calculateFees({ account: acc, transaction: tx });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction useAllAmount prop changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    tx.useAllAmount = true;
    await calculateFees({ account: acc, transaction: tx });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction mode changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    tx.mode = "delegate";
    tx.validators = [{ address: "toto", amount: new BigNumber(1) }];
    await calculateFees({ account: acc, transaction: tx });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction validator address changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    tx.mode = "delegate";
    tx.validators = [{ address: "toto", amount: new BigNumber(1) }];
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    tx.validators = [{ address: "totoleretour", amount: new BigNumber(1) }];
    await calculateFees({ account: acc, transaction: tx });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction validator amount changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    tx.mode = "delegate";
    tx.validators = [{ address: "toto", amount: new BigNumber(1) }];
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    tx.validators = [{ address: "toto", amount: new BigNumber(2) }];
    await calculateFees({ account: acc, transaction: tx });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction memo changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    tx.memo = "yikes";
    await calculateFees({ account: acc, transaction: tx });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction sourceValidator changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    tx.sourceValidator = "source";
    await calculateFees({ account: acc, transaction: tx });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });
});
