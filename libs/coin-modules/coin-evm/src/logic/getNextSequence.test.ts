import type { EvmConfigInfo } from "../config";
import { createMockEvmContext } from "../fixtures/context.fixtures";
import { getNodeApi } from "../network/node";
import { mockNodeApi } from "../network/node/node.fixtures";
import { getNextSequence } from "./getNextSequence";

jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));

const mockGetNodeApi = jest.mocked(getNodeApi);

describe("getNextSequence", () => {
  const externalMocks = mockNodeApi();
  const ledgerMocks = mockNodeApi();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockImplementation((config: EvmConfigInfo, _currencyId: string) => {
      return config?.node?.type === "ledger" ? ledgerMocks : externalMocks;
    });
  });

  it.each([
    ["an external node", "external", externalMocks],
    ["a ledger node", "ledger", ledgerMocks],
  ])("returns next sequence for an address using %s", async (_, type, nodeApiMock) => {
    const context = createMockEvmContext({ node: { type } } as Partial<EvmConfigInfo>);
    nodeApiMock.getTransactionCount.mockResolvedValue(42);

    expect(await getNextSequence(context, "", "")).toEqual(42n);
  });
});
