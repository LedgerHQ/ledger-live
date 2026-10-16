import BigNumber from "bignumber.js";
import { getNodeApi } from "@ledgerhq/coin-evm/network";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import type { Account, Operation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { chainReadsFor } from "../../bridge/generic-coin-framework/chainReads";
import { isPortfolioEnabledFor } from "../../bridge/generic-coin-framework/portfolio/config";
import { getEvmTransactionByHash } from "./getTransactionByHash";

jest.mock("@ledgerhq/coin-evm/network", () => ({
  ...jest.requireActual("@ledgerhq/coin-evm/network"),
  getNodeApi: jest.fn(),
}));
jest.mock("../../bridge/generic-coin-framework/api/context", () => ({ buildContext: jest.fn() }));
jest.mock("../../bridge/generic-coin-framework/chainReads", () => ({ chainReadsFor: jest.fn() }));
jest.mock("../../bridge/generic-coin-framework/portfolio/config", () => ({
  isPortfolioEnabledFor: jest.fn(),
}));

const ethereum = getCryptoCurrencyById("ethereum");
const config = { chainId: 1 };
const logger = () => undefined;
const getTransaction = jest.fn();
const getTransactionInfo = jest.fn();

const operation = (fields: Partial<Operation>): Operation =>
  ({
    id: "op",
    hash: "0xhash",
    type: "OUT",
    value: new BigNumber(1_021),
    fee: new BigNumber(21),
    blockHeight: 12,
    blockHash: "0xblock",
    ...fields,
  }) as Operation;

const account = (operations: Operation[] = []) =>
  ({ type: "Account", currency: ethereum, operations }) as unknown as Account;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(buildContext).mockReturnValue({ config: async () => config, logger } as never);
  jest.mocked(getNodeApi).mockReturnValue({ getTransaction } as never);
  jest.mocked(chainReadsFor).mockResolvedValue({ getTransactionInfo } as never);
});

describe("getEvmTransactionByHash on the legacy path", () => {
  beforeEach(() => jest.mocked(isPortfolioEnabledFor).mockReturnValue(false));

  it("answers the node's transaction", async () => {
    const transaction = { hash: "0xhash", blockHeight: 12, nonce: 4, gasUsed: "21000" };
    getTransaction.mockResolvedValue(transaction);

    await expect(getEvmTransactionByHash(account(), "0xhash")).resolves.toBe(transaction);
    expect(getNodeApi).toHaveBeenCalledWith(config, logger);
    expect(getTransaction).toHaveBeenCalledWith("0xhash");
    expect(chainReadsFor).not.toHaveBeenCalled();
  });

  it("answers nothing while the node does not find it", async () => {
    getTransaction.mockRejectedValue(new Error("not found"));
    await expect(getEvmTransactionByHash(account(), "0xhash")).resolves.toEqual({});
  });
});

describe("getEvmTransactionByHash through the portfolio layer", () => {
  beforeEach(() => jest.mocked(isPortfolioEnabledFor).mockReturnValue(true));

  it("answers the transaction the portfolio looks up, never the node", async () => {
    getTransactionInfo.mockResolvedValueOnce({
      hash: "0xhash",
      block: { height: 12, hash: "0xblock", time: new Date() },
      value: 1_000n,
    });

    await expect(getEvmTransactionByHash(account(), "0xhash")).resolves.toEqual({
      hash: "0xhash",
      blockHeight: 12,
      blockHash: "0xblock",
      value: "1000",
    });
    expect(chainReadsFor).toHaveBeenCalledWith(ethereum);
    expect(getTransactionInfo).toHaveBeenCalledWith("0xhash");
    expect(getNodeApi).not.toHaveBeenCalled();
  });

  it("answers a known transaction not in a block yet, and nothing for an unknown one", async () => {
    getTransactionInfo.mockResolvedValueOnce({ hash: "0xhash", block: null });
    await expect(getEvmTransactionByHash(account(), "0xhash")).resolves.toEqual({
      hash: "0xhash",
      blockHeight: undefined,
      blockHash: undefined,
      value: "0",
    });

    getTransactionInfo.mockResolvedValueOnce(undefined);
    await expect(getEvmTransactionByHash(account(), "0xhash")).resolves.toEqual({});
  });

  it("answers nothing yet when the lookup fails", async () => {
    getTransactionInfo.mockRejectedValueOnce(new Error("node down"));
    await expect(getEvmTransactionByHash(account(), "0xhash")).resolves.toEqual({});
  });

  describe("when the portfolio looks no transaction up (G1)", () => {
    beforeEach(() =>
      getTransactionInfo.mockRejectedValue(new ChainReadUnsupportedError("not served")),
    );

    it("answers the transaction the synced account holds in a block, its native amount", async () => {
      await expect(
        getEvmTransactionByHash(account([operation({ hash: "other" }), operation({})]), "0xhash"),
      ).resolves.toEqual({ hash: "0xhash", blockHeight: 12, blockHash: "0xblock", value: "1000" });
      // A token transfer's fee operation sends no native amount.
      await expect(
        getEvmTransactionByHash(
          account([operation({ type: "FEES", value: new BigNumber(21), blockHash: null })]),
          "0xhash",
        ),
      ).resolves.toEqual({ hash: "0xhash", blockHeight: 12, blockHash: undefined, value: "0" });
      await expect(
        getEvmTransactionByHash(account([operation({ type: "IN" })]), "0xhash"),
      ).resolves.toMatchObject({ value: "1021" });
    });

    it("answers nothing for a transaction the account holds pending, or does not hold", async () => {
      await expect(
        getEvmTransactionByHash(account([operation({ blockHeight: null })]), "0xhash"),
      ).resolves.toEqual({});
      await expect(getEvmTransactionByHash(account(), "0xhash")).resolves.toEqual({});
    });
  });
});
