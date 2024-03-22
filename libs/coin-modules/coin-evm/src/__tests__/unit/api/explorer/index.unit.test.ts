import { AssertionError, fail } from "assert";
import etherscanLikeApi from "../../../../api/explorer/etherscan";
import ledgerExplorerApi from "../../../../api/explorer/ledger";
import { getExplorerApi } from "../../../../api/explorer";
import { UnknownExplorer } from "../../../../errors";
import { getCoinConfig } from "../../../../config";

jest.mock("../../../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

mockGetConfig.mockImplementation((currency: any): any => {
  switch (currency.id) {
    case "anything-coin":
      return { info: { explorer: { type: "anything", uri: "notworking" } } };
    case "etherscan-coin": {
      return { info: { explorer: { type: "etherscan", uri: "working" } } };
    }
    case "blockscout-coin": {
      return { info: { explorer: { type: "blockscout", uri: "working" } } };
    }
    case "ledger-coin": {
      return { info: { explorer: { type: "ledger", explorerId: "eth" } } };
    }
  }
});

describe("EVM Family", () => {
  describe("api/explorer/index.ts", () => {
    describe("getExplorerApi", () => {
      it("should throw when requesting a non existing explorer", () => {
        try {
          getExplorerApi({
            id: "anything-coin",
          } as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(UnknownExplorer);
        }
      });

      it("should return the etherscan api", () => {
        const explorerA = getExplorerApi({ id: "etherscan-coin" } as any);
        const explorerB = getExplorerApi({ id: "blockscout-coin" } as any);

        expect(explorerA).toBe(etherscanLikeApi);
        expect(explorerB).toBe(etherscanLikeApi);
      });

      it("should return the ledger api", () => {
        const explorerA = getExplorerApi({ id: "ledger-coin" } as any);

        expect(explorerA).toBe(ledgerExplorerApi);
      });
    });
  });
});
