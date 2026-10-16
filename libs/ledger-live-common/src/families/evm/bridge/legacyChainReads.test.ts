import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getNodeApi } from "@ledgerhq/coin-evm/network";
import { fetchRedelegations } from "@ledgerhq/coin-evm/staking";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import { LedgerAPI4xx } from "@ledgerhq/live-network/errors";
import BigNumber from "bignumber.js";
import { legacyChainReads } from "./legacyChainReads";

jest.mock("@ledgerhq/coin-evm/network", () => ({
  ...jest.requireActual("@ledgerhq/coin-evm/network"),
  getNodeApi: jest.fn(),
}));
jest.mock("@ledgerhq/coin-evm/staking", () => ({
  fetchRedelegations: jest.fn(),
}));

const seiEvm = getCryptoCurrencyById("sei_evm");
const logger = jest.fn();
const externalNode = { type: "external", uri: "https://sei.rpc" };
const contextWith = (config: Record<string, unknown>) => ({
  config: jest.fn(async () => config),
  logger,
});

describe("evm legacyChainReads", () => {
  const getTransaction = jest.fn();
  const getBlockByHeight = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getNodeApi).mockReturnValue({ getTransaction, getBlockByHeight } as never);
  });

  describe("call", () => {
    const params = { to: "0x0000000000000000000000000000000000001004", data: "0xabcd" };

    it("calls coin-evm in one attempt through an external node", async () => {
      const config = { chainId: 1329, node: { ...externalNode, retries: 3 } };
      const context = contextWith(config);
      const coinModuleApi = {
        call: jest.fn(
          async (
            received: { config: (id?: string) => Promise<unknown>; logger: unknown },
            _params: unknown,
          ) => ({ config: await received.config("sei_evm"), logger: received.logger }),
        ),
        supports: jest.fn(() => true),
      };

      const reads = legacyChainReads(seiEvm, coinModuleApi as never, context);

      await expect(reads.call?.(params)).resolves.toEqual({
        config: { chainId: 1329, node: { ...externalNode, retries: 0 } },
        logger,
      });
      expect(coinModuleApi.call).toHaveBeenCalledTimes(1);
      expect(coinModuleApi.call.mock.calls[0][1]).toBe(params);
      expect(context.config).toHaveBeenCalledWith("sei_evm");
      expect(coinModuleApi.supports).toHaveBeenCalledWith("call");
    });

    it("leaves the config of another node as it is", async () => {
      const config = { node: { type: "ledger", explorerId: "eth" } };
      const coinModuleApi = {
        call: jest.fn(async (received: { config: () => Promise<unknown> }) => received.config()),
      };

      const reads = legacyChainReads(seiEvm, coinModuleApi as never, contextWith(config));

      await expect(reads.call?.(params)).resolves.toBe(config);
    });

    it("is unsupported when the coin module does not make calls", async () => {
      const call = jest.fn();
      const reads = legacyChainReads(seiEvm, {} as never, contextWith({}));
      const refusing = legacyChainReads(
        seiEvm,
        { call, supports: () => false } as never,
        contextWith({}),
      );

      await expect(reads.call?.(params)).rejects.toBeInstanceOf(ChainReadUnsupportedError);
      await expect(refusing.call?.(params)).rejects.toBeInstanceOf(ChainReadUnsupportedError);
      expect(call).not.toHaveBeenCalled();
    });
  });

  describe("getAccountInfo", () => {
    it("adds the redelegations of the Cosmos staking module to coin-evm's metadata", async () => {
      const redelegations = [
        {
          validatorSrcAddress: "a",
          validatorDstAddress: "b",
          amount: new BigNumber(5),
          completionDate: new Date("2099-01-01T00:00:00.000Z"),
        },
      ];
      jest.mocked(fetchRedelegations).mockResolvedValue(redelegations);
      const config = { node: externalNode };
      const context = contextWith(config);
      const coinModuleApi = { getAccountInfo: jest.fn(async () => ({ type: "evm", extra: 1 })) };

      const reads = legacyChainReads(seiEvm, coinModuleApi as never, context);

      await expect(reads.getAccountInfo?.("0xme")).resolves.toEqual({
        type: "evm",
        extra: 1,
        redelegations,
      });
      expect(coinModuleApi.getAccountInfo).toHaveBeenCalledWith(context, "0xme");
      expect(fetchRedelegations).toHaveBeenCalledWith(config, "0xme", logger);
    });

    it("reports none when the lookup fails, on a coin module without metadata", async () => {
      jest.mocked(fetchRedelegations).mockRejectedValue(new Error("rest down"));

      const reads = legacyChainReads(seiEvm, {} as never, contextWith({}));

      await expect(reads.getAccountInfo?.("0xme")).resolves.toEqual({
        type: "none",
        redelegations: [],
      });
    });
  });

  describe("getTransactionInfo", () => {
    const transaction = {
      hash: "0xhash",
      blockHeight: 12,
      blockHash: "0xblock",
      nonce: 7,
      gasPrice: "3",
      gasUsed: "21000",
      value: "100",
      input: "0xcalldata",
    };

    it("reads a mined transaction from the node, its block time and its calldata", async () => {
      getTransaction.mockResolvedValue(transaction);
      getBlockByHeight.mockResolvedValue({
        height: 12,
        hash: "0xother",
        timestamp: 1_700_000_000_000,
      });
      const config = { node: externalNode };

      const reads = legacyChainReads(seiEvm, {} as never, contextWith(config));

      await expect(reads.getTransactionInfo?.("0xhash")).resolves.toEqual({
        hash: "0xhash",
        block: { height: 12, hash: "0xblock", time: new Date(1_700_000_000_000) },
        fee: 63_000n,
        value: 100n,
        sequence: 7n,
        data: "0xcalldata",
      });
      expect(getNodeApi).toHaveBeenCalledWith(config, logger);
      expect(getTransaction).toHaveBeenCalledWith("0xhash");
      expect(getBlockByHeight).toHaveBeenCalledWith(12);
    });

    it("takes the block's hash when the node reports none, and no calldata off an external node", async () => {
      getTransaction.mockResolvedValue({ ...transaction, blockHash: undefined, value: 1n });
      getBlockByHeight.mockResolvedValue({ height: 12, hash: "0xother", timestamp: 0 });

      const reads = legacyChainReads(
        seiEvm,
        {} as never,
        contextWith({ node: { type: "ledger" } }),
      );

      await expect(reads.getTransactionInfo?.("0xhash")).resolves.toEqual({
        hash: "0xhash",
        block: { height: 12, hash: "0xother", time: new Date(0) },
        fee: 63_000n,
        value: 1n,
        sequence: 7n,
      });
    });

    it("reads a known transaction not in a block yet, without calldata", async () => {
      getTransaction.mockResolvedValue({
        ...transaction,
        blockHeight: undefined,
        input: undefined,
      });

      const reads = legacyChainReads(seiEvm, {} as never, contextWith({ node: externalNode }));

      await expect(reads.getTransactionInfo?.("0xhash")).resolves.toEqual({
        hash: "0xhash",
        block: null,
        fee: 63_000n,
        value: 100n,
        sequence: 7n,
      });
      expect(getBlockByHeight).not.toHaveBeenCalled();
    });

    it("tells an unknown hash apart from a failure", async () => {
      const reads = legacyChainReads(seiEvm, {} as never, contextWith({}));

      getTransaction.mockRejectedValueOnce(new LedgerAPI4xx("not found", { status: 404 }));
      await expect(reads.getTransactionInfo?.("0xhash")).resolves.toBeUndefined();

      const forbidden = new LedgerAPI4xx("forbidden", { status: 403 });
      getTransaction.mockRejectedValueOnce(forbidden);
      await expect(reads.getTransactionInfo?.("0xhash")).rejects.toBe(forbidden);

      getTransaction.mockRejectedValueOnce("down");
      await expect(reads.getTransactionInfo?.("0xhash")).rejects.toBe("down");
    });
  });
});
