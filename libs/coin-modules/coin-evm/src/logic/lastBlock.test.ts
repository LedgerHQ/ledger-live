import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { BlockFinalizationTag, type EvmConfigInfo } from "../config";
import { createMockEvmContext } from "../fixtures/context.fixtures";
import { getNodeApi } from "../network/node";
import { mockNodeApi } from "../network/node/node.fixtures";
import { lastBlock } from "./lastBlock";

jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));

const mockGetNodeApi = jest.mocked(getNodeApi);

describe("lastBlock", () => {
  const externalMocks = mockNodeApi();
  const ledgerMocks = mockNodeApi();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockImplementation((config: EvmConfigInfo, _currency: CryptoCurrency) => {
      return config?.node?.type === "ledger" ? ledgerMocks : externalMocks;
    });
  });

  it.each([
    ["an external node", "external", externalMocks],
    ["a ledger node", "ledger", ledgerMocks],
  ])("returns last block info using %s", async (_, type, nodeApiMock) => {
    const blockResult = {
      hash: "hash",
      parentHash: "parentHash",
      height: 33,
      timestamp: new Date("2025-12-31").getTime(),
    };
    const expectedInfo = { hash: "hash", height: 33, time: new Date("2025-12-31") };

    const context = createMockEvmContext({ node: { type } } as Partial<EvmConfigInfo>);
    nodeApiMock.getBlockByHeight.mockResolvedValue(blockResult);

    expect(await lastBlock(context, {} as CryptoCurrency)).toEqual(expectedInfo);
  });

  it.each([
    ["an external node", "external", externalMocks],
    ["a ledger node", "ledger", ledgerMocks],
  ])("passes 'latest' by default to getBlockByHeight using %s", async (_, type, nodeApiMock) => {
    const blockResult = {
      hash: "hash",
      parentHash: "parentHash",
      height: 33,
      timestamp: new Date("2025-12-31").getTime(),
    };

    const context = createMockEvmContext({ node: { type } } as Partial<EvmConfigInfo>);
    nodeApiMock.getBlockByHeight.mockResolvedValue(blockResult);

    await lastBlock(context, {} as CryptoCurrency);

    expect(nodeApiMock.getBlockByHeight).toHaveBeenCalledWith(expect.anything(), "latest");
  });

  it.each<[BlockFinalizationTag, string, string, jest.Mocked<ReturnType<typeof mockNodeApi>>]>([
    ["finalized", "an external node", "external", externalMocks],
    ["finalized", "a ledger node", "ledger", ledgerMocks],
    ["safe", "an external node", "external", externalMocks],
    ["safe", "a ledger node", "ledger", ledgerMocks],
  ])(
    "forwards finalizationLevel '%s' to getBlockByHeight using %s",
    async (finalizationLevel, _, type, nodeApiMock) => {
      const blockResult = {
        hash: "hash",
        parentHash: "parentHash",
        height: 33,
        timestamp: new Date("2025-12-31").getTime(),
      };
      const expectedInfo = { hash: "hash", height: 33, time: new Date("2025-12-31") };

      const context = createMockEvmContext({
        node: { type },
        finalizationLevel,
      } as Partial<EvmConfigInfo>);
      nodeApiMock.getBlockByHeight.mockResolvedValue(blockResult);

      expect(await lastBlock(context, {} as CryptoCurrency)).toEqual(expectedInfo);
      expect(nodeApiMock.getBlockByHeight).toHaveBeenCalledWith(
        expect.anything(),
        finalizationLevel,
      );
    },
  );
});
