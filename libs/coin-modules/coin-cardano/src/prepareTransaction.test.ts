import BigNumber from "bignumber.js";
import { getCardanoAccountFixture } from "./fixtures/accounts";
import { getProtocolParamsFixture } from "./fixtures/protocolParams";
import { fetchNetworkInfo } from "./api/getNetworkInfo";
import { cardanoCoinConfig, cardanoTestnetCoinConfig, createMockContext } from "./fixtures/config";
import { buildPrepareTransaction } from "./prepareTransaction";
import type { Transaction } from "./types";

jest.mock("./api/getNetworkInfo");
const mockFetchNetworkInfo = jest.mocked(fetchNetworkInfo);

// Passing protocolParams on the transaction makes prepareTransaction skip its network fetch.
const baseTransaction = (): Transaction => ({
  family: "cardano",
  recipient:
    "addr_test1qz7jw975stagnvs00wsjny6y6gpazn86yvwcm2vy02j3up7mt68vuzvz4nzgs00x0shrgywvy674v6r2zcs8fxvvq27qfjq8np",
  amount: new BigNumber(0),
  mode: "send",
  poolId: undefined,
  protocolParams: getProtocolParamsFixture(),
});

describe("prepareTransaction", () => {
  const prepareTransaction = buildPrepareTransaction(createMockContext());
  const buildFundedAccount = () => {
    const account = getCardanoAccountFixture({ delegation: undefined });
    account.balance = new BigNumber(100e6);
    account.spendableBalance = new BigNumber(100e6);
    account.cardanoResources.protocolParams = getProtocolParamsFixture();
    return account;
  };

  it.each([
    ["cardano", cardanoCoinConfig],
    ["cardano_testnet", cardanoTestnetCoinConfig],
  ])("reads the protocol params from the %s config at call time", async (id, config) => {
    mockFetchNetworkInfo.mockResolvedValue({ protocolParams: getProtocolParamsFixture() });
    const account = buildFundedAccount();
    account.currency = { ...account.currency, id };

    await prepareTransaction(account, { ...baseTransaction(), protocolParams: undefined });

    expect(mockFetchNetworkInfo).toHaveBeenLastCalledWith(config);
  });

  it("loads the fees and the amount of a send", async () => {
    const prepared = await prepareTransaction(buildFundedAccount(), {
      ...baseTransaction(),
      amount: new BigNumber(2e6),
    });

    expect({ amount: prepared.amount.toString(), feesArePositive: prepared.fees?.gt(0) }).toEqual({
      amount: "2000000",
      feesArePositive: true,
    });
  });

  it("sets the maximum spendable amount for a send max", async () => {
    const prepared = await prepareTransaction(buildFundedAccount(), {
      ...baseTransaction(),
      useAllAmount: true,
    });

    expect({
      amount: prepared.amount.toString(),
      fees: prepared.fees?.toString(),
      total: prepared.amount.plus(prepared.fees ?? 0).toString(),
    }).toEqual({ amount: "99834631", fees: "165369", total: "100000000" });
  });

  it("returns the same result when an already prepared transaction is prepared again or in parallel", async () => {
    const account = buildFundedAccount();
    const transaction = { ...baseTransaction(), amount: new BigNumber(2e6) };

    const first = await prepareTransaction(account, { ...transaction });
    const second = await prepareTransaction(account, { ...first });
    const [parallelA, parallelB] = await Promise.all([
      prepareTransaction(account, { ...transaction }),
      prepareTransaction(account, { ...first }),
    ]);

    expect([second, parallelA, parallelB]).toEqual([first, first, first]);
  });

  it("reports the real network fee, not the whole balance, on a low-balance account with no amount entered (LIVE-33176)", async () => {
    const account = getCardanoAccountFixture({ delegation: undefined });
    account.balance = new BigNumber(1e6);
    account.spendableBalance = new BigNumber(1e6);
    account.cardanoResources.protocolParams = getProtocolParamsFixture();
    account.cardanoResources.utxos = [
      { ...account.cardanoResources.utxos[0], amount: new BigNumber(1e6) },
    ];

    const prepared = await prepareTransaction(account, baseTransaction());

    // Before the fix Typhon's dust guard set the fee to the whole ~1 ADA balance; it must now show
    // the protocol-minimum fee (a few hundred thousand lovelace), well under the balance.
    expect(prepared.amount.toString()).toBe("0");
    expect(prepared.fees?.gt(0)).toBe(true);
    expect(prepared.fees?.lt(1e6)).toBe(true);
  });
});
