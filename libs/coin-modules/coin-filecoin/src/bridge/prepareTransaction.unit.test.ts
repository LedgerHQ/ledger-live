import BigNumber from "bignumber.js";
import { encodeTxnParams, generateTokenTxnParams } from "../erc20/tokenAccounts";
import { fetchEstimatedFees } from "../network";
import {
  createMockAccount,
  createMockEstimatedFeesResponse,
  createMockTokenAccount,
  createMockTransaction,
} from "../test/fixtures";
import { BroadcastBlockIncl } from "../types";
import { prepareTransaction } from "./prepareTransaction";
import { Methods } from "./utils";

jest.mock("../network/api");

const F1_ADDRESS = "f1plmg3kklvmnodfboimcq5w27mnfs2hwjtas6gia";
const F4_ADDRESS = "f410fncojwmrseefktoco6rcnb3zv2eiqfli7muhvqma";
const ETH_ADDRESS = "0x689c9b3232210aa9b84ef444d0ef35d11102ad1f";
const F0_ADDRESS = "f01840380";

const mockedFetchEstimatedFees = jest.mocked(fetchEstimatedFees);

const makeAccount = () =>
  createMockAccount({
    freshAddress: F1_ADDRESS,
    balance: new BigNumber(1_000_000),
    spendableBalance: new BigNumber(1_000_000),
  });

const makeTransaction = (overrides: Parameters<typeof createMockTransaction>[0] = {}) =>
  createMockTransaction({
    recipient: F1_ADDRESS,
    amount: new BigNumber(1),
    gasLimit: new BigNumber(0),
    gasFeeCap: new BigNumber(0),
    gasPremium: new BigNumber(0),
    ...overrides,
  });

describe("prepareTransaction (legacy bridge)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchEstimatedFees.mockResolvedValue(
      createMockEstimatedFeesResponse({
        gas_fee_cap: "1000",
        gas_premium: "100",
        gas_limit: 10,
        nonce: 7,
      }),
    );
  });

  it("patches the gas fields, the nonce and the Transfer method for an f1 recipient", async () => {
    const result = await prepareTransaction(makeAccount(), makeTransaction());

    expect(result.gasFeeCap).toEqual(new BigNumber(1000));
    expect(result.gasPremium).toEqual(new BigNumber(100));
    expect(result.gasLimit).toEqual(new BigNumber(10));
    expect(result.nonce).toEqual(7);
    expect(result.method).toEqual(Methods.Transfer);
    expect(result.params).toBeUndefined();
    expect(mockedFetchEstimatedFees).toHaveBeenCalledWith({
      to: F1_ADDRESS,
      from: F1_ADDRESS,
      methodNum: Methods.Transfer,
      blockIncl: BroadcastBlockIncl,
    });
  });

  it("uses the InvokeEVM method for an eth recipient", async () => {
    const result = await prepareTransaction(
      makeAccount(),
      makeTransaction({ recipient: ETH_ADDRESS }),
    );

    expect(result.method).toEqual(Methods.InvokeEVM);
    expect(mockedFetchEstimatedFees).toHaveBeenCalledWith(
      expect.objectContaining({ methodNum: Methods.InvokeEVM }),
    );
  });

  it("uses the InvokeEVM method for an f4 recipient", async () => {
    const result = await prepareTransaction(
      makeAccount(),
      makeTransaction({ recipient: F4_ADDRESS }),
    );

    expect(result.method).toEqual(Methods.InvokeEVM);
  });

  it("sets the amount to the balance minus the fees on send max", async () => {
    const result = await prepareTransaction(makeAccount(), makeTransaction({ useAllAmount: true }));

    expect(result.amount).toEqual(new BigNumber(990000));
    expect(result.params).toBeUndefined();
  });

  it.each([
    ["an invalid", "novalidaddress"],
    ["an empty", ""],
  ])("returns the same transaction when the recipient is %s", async (_name, recipient) => {
    const transaction = makeTransaction({ recipient });

    const result = await prepareTransaction(makeAccount(), transaction);

    expect(result).toBe(transaction);
    expect(mockedFetchEstimatedFees).not.toHaveBeenCalled();
  });

  it("returns the same transaction when the sender is invalid", async () => {
    const transaction = makeTransaction();

    const result = await prepareTransaction(
      createMockAccount({ freshAddress: "novalidaddress" }),
      transaction,
    );

    expect(result).toBe(transaction);
    expect(mockedFetchEstimatedFees).not.toHaveBeenCalled();
  });

  describe("with a token sub account", () => {
    const parent = makeAccount();
    const baseTokenAccount = createMockTokenAccount(parent);
    const tokenAccount = {
      ...baseTokenAccount,
      id: "token-sub-account",
      spendableBalance: new BigNumber(1000),
      token: { ...baseTokenAccount.token, contractAddress: F4_ADDRESS },
    };
    const accountWithToken = createMockAccount({
      freshAddress: F1_ADDRESS,
      balance: new BigNumber(1_000_000),
      spendableBalance: new BigNumber(1_000_000),
      subAccounts: [tokenAccount],
    });
    const makeTokenTransaction = (overrides: Parameters<typeof createMockTransaction>[0] = {}) =>
      makeTransaction({ subAccountId: tokenAccount.id, amount: new BigNumber(10), ...overrides });

    it("targets the token contract and generates the evm params for an eth-convertible recipient", async () => {
      const result = await prepareTransaction(
        accountWithToken,
        makeTokenTransaction({ recipient: F0_ADDRESS }),
      );

      const params = generateTokenTxnParams(F0_ADDRESS, new BigNumber(10));
      expect(result.method).toEqual(Methods.InvokeEVM);
      expect(result.params).toEqual(params);
      expect(mockedFetchEstimatedFees).toHaveBeenCalledWith({
        to: F4_ADDRESS,
        from: F1_ADDRESS,
        methodNum: Methods.InvokeEVM,
        blockIncl: BroadcastBlockIncl,
        params: encodeTxnParams(params),
        value: "0",
      });
    });

    it("estimates the fees with fallback params when the recipient is not eth-convertible", async () => {
      const result = await prepareTransaction(
        accountWithToken,
        makeTokenTransaction({ recipient: F1_ADDRESS }),
      );

      expect(result.params).toBeUndefined();
      expect(mockedFetchEstimatedFees).toHaveBeenCalledWith(
        expect.objectContaining({
          params: encodeTxnParams(generateTokenTxnParams(F4_ADDRESS, new BigNumber(1))),
          value: "0",
        }),
      );
    });

    it("estimates the fees with an amount of 1 when the token amount is zero", async () => {
      await prepareTransaction(
        accountWithToken,
        makeTokenTransaction({ recipient: F0_ADDRESS, amount: new BigNumber(0) }),
      );

      expect(mockedFetchEstimatedFees).toHaveBeenCalledWith(
        expect.objectContaining({
          params: encodeTxnParams(generateTokenTxnParams(F0_ADDRESS, new BigNumber(1))),
        }),
      );
    });

    it("sets the amount to the token spendable balance and regenerates the params on send max", async () => {
      const result = await prepareTransaction(
        accountWithToken,
        makeTokenTransaction({ recipient: F0_ADDRESS, useAllAmount: true }),
      );

      expect(result.amount).toEqual(new BigNumber(1000));
      expect(result.params).toEqual(generateTokenTxnParams(F0_ADDRESS, new BigNumber(1000)));
    });
  });
});
