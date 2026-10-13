import { getEnv } from "@ledgerhq/live-env";
import cryptoFactory from "./chain/chain";
import { createEmptyStakingResources } from "@ledgerhq/types-live";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrencyId } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import { messageParamsFromTransaction } from "./buildTransaction";
import cosmosCoinConfig, { cosmosConfig } from "./config";
import { calculateFees, getEstimatedFees, prepareTransaction } from "./prepareTransaction";
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
      currencyId => LiveConfig.getValueByKey(`config_currency_${currencyId}`) ?? {},
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
    const { gasWanted } = await getEstimatedFees(
      messageParamsFromTransaction(account, transaction),
    );
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
    const { gasWantedFees, gasWanted } = await getEstimatedFees(
      messageParamsFromTransaction(account, transaction),
    );
    expect(gasWantedFees.gt(0)).toEqual(true);
    expect(gasWanted.gt(0)).toEqual(true);
  });
});

describe("calculateFees", () => {
  beforeAll(() => {
    LiveConfig.setConfig(cosmosConfig);
    cosmosCoinConfig.setCoinConfig(
      currencyId => LiveConfig.getValueByKey(`config_currency_${currencyId}`) ?? {},
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
    await calculateFees({
      account: acc,
      transaction: { ...tx, mode: "delegate", valAddress: "toto" },
    });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction validator address changed", async () => {
    const acc = createAccount();
    const tx: Transaction = { ...createTransaction(), mode: "delegate", valAddress: "toto" };
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    await calculateFees({ account: acc, transaction: { ...tx, valAddress: "totoleretour" } });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction amount changed on a staking transaction", async () => {
    const acc = createAccount();
    const tx: Transaction = { ...createTransaction(), mode: "delegate", valAddress: "toto" };
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    await calculateFees({ account: acc, transaction: { ...tx, amount: new BigNumber(2) } });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if transaction memo changed", async () => {
    const acc = createAccount();
    const tx = createTransaction();
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    await calculateFees({ account: acc, transaction: { ...tx, memo: "yikes" } });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if redelegation source validator changed", async () => {
    const acc = createAccount();
    const tx: Transaction = {
      ...createTransaction(),
      mode: "redelegate",
      valAddress: "source",
      dstValAddress: "destination",
    };
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    await calculateFees({ account: acc, transaction: { ...tx, valAddress: "other source" } });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("should estimate fees again if redelegation destination validator changed", async () => {
    const acc = createAccount();
    const tx: Transaction = {
      ...createTransaction(),
      mode: "redelegate",
      valAddress: "source",
      dstValAddress: "destination",
    };
    await calculateFees({ account: acc, transaction: tx });
    const callsAfterFirst = networkMock.mock.calls.length;
    await calculateFees({ account: acc, transaction: { ...tx, dstValAddress: "other" } });
    expect(networkMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });
});

describe("prepareTransaction", () => {
  const stakingAccount = () =>
    ({
      id: "accountId",
      freshAddress: "cosmos1testaddress",
      currency: { id: "cosmos", units: [{}, { code: "atom" }] },
      balance: new BigNumber("1000000000"),
      spendableBalance: new BigNumber("500000000"),
      seedIdentifier: "seedIdentifier",
      stakingResources: {
        ...createEmptyStakingResources(),
        delegatedBalance: new BigNumber("400000000"),
        unbondingBalance: new BigNumber("100000000"),
      },
    }) as unknown as CosmosAccount;

  const sendTransaction = (patch: Record<string, unknown> = {}) =>
    ({
      mode: "send",
      recipient: "cosmosrecipientaddress",
      amount: new BigNumber("1000000"),
      memo: "test memo",
      useAllAmount: false,
      ...patch,
    }) as unknown as Transaction;

  beforeAll(() => {
    LiveConfig.setConfig(cosmosConfig);
    cosmosCoinConfig.setCoinConfig(
      currencyId => LiveConfig.getValueByKey(`config_currency_${currencyId}`) ?? {},
    );
  });

  beforeEach(() => {
    networkMock.mockReset();
    networkMock.mockResolvedValue({ data: { gas_info: { gas_used: 42000 } } });
    calculateFees.reset();
  });

  it("fills in the estimated fees and gas", async () => {
    const prepared = await prepareTransaction(stakingAccount(), sendTransaction());

    expect(prepared.fees?.gt(0)).toBe(true);
    expect(prepared.gas?.gt(0)).toBe(true);
    expect(prepared.amount).toEqual(new BigNumber("1000000"));
  });

  it("defaults the memo of a staking transaction to Ledger Live", async () => {
    const prepared = await prepareTransaction(
      stakingAccount(),
      sendTransaction({ mode: "delegate", memo: undefined }),
    );

    expect(prepared.memo).toBe("Ledger Live");
  });

  it("keeps the memo the user typed on a staking transaction", async () => {
    const prepared = await prepareTransaction(
      stakingAccount(),
      sendTransaction({ mode: "delegate", memo: "my memo" }),
    );

    expect(prepared.memo).toBe("my memo");
  });

  it("does not invent a memo for a send", async () => {
    const prepared = await prepareTransaction(
      stakingAccount(),
      sendTransaction({ memo: undefined }),
    );

    expect(prepared.memo).toBeUndefined();
  });

  it("sends the whole balance minus fees, staked and unbonding principal", async () => {
    const prepared = await prepareTransaction(
      stakingAccount(),
      sendTransaction({ useAllAmount: true }),
    );

    expect(prepared.amount).toEqual(
      new BigNumber("1000000000").minus(prepared.fees!).minus("500000000"),
    );
  });

  it("fills in the gas of a transaction that already carries the estimated fees", async () => {
    const account = stakingAccount();
    const prepared = await prepareTransaction(account, sendTransaction());
    const { gas, ...withoutGas } = prepared;

    const result = await prepareTransaction(account, withoutGas as Transaction);

    expect(result).not.toBe(withoutGas);
    expect(result.gas).toEqual(gas);
  });

  it("returns the same transaction when nothing needs updating", async () => {
    const account = stakingAccount();
    const prepared = await prepareTransaction(account, sendTransaction());

    expect(await prepareTransaction(account, prepared)).toBe(prepared);
  });
});

describe("getEstimatedFees when the simulation fails", () => {
  beforeAll(() => {
    LiveConfig.setConfig(cosmosConfig);
    cosmosCoinConfig.setCoinConfig(
      currencyId => LiveConfig.getValueByKey(`config_currency_${currencyId}`) ?? {},
    );
  });

  it("falls back to the chain's default gas, amplified like a simulated one", async () => {
    // @ts-expect-error method is mocked
    network.mockResolvedValue({ data: { gas_info: { gas_used: 0 } } });

    const { gasWanted, gasWantedFees } = await getEstimatedFees(
      messageParamsFromTransaction(account, transaction),
    );

    expect(gasWanted).toEqual(
      new BigNumber(cryptoFactory("cosmos").defaultGas)
        .times(getEnv("COSMOS_GAS_AMPLIFIER"))
        .integerValue(BigNumber.ROUND_CEIL),
    );
    expect(gasWantedFees.gt(0)).toBe(true);
  });
});
