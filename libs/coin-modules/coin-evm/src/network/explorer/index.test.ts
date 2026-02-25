import { AssertionError, fail } from "assert";
import { getCoinConfig } from "../../config";
import { UnknownExplorer } from "../../errors";
import etherscanLikeApi from "./etherscan";
import ledgerExplorerApi from "./ledger";
import { getExplorerApi } from "./index";

jest.mock("../../config");
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
    case "etherscan-coin-no-cache": {
      return { info: { explorer: { type: "etherscan", uri: "working", noCache: true } } };
    }
    case "blockscout-coin-no-cache": {
      return { info: { explorer: { type: "blockscout", uri: "working", noCache: true } } };
    }
    case "ledger-coin": {
      return { info: { explorer: { type: "ledger", explorerId: "eth" } } };
    }
  }
});

describe("EVM Family", () => {
  describe("network/explorer/index.ts", () => {
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

        expect(explorerA).toBe(etherscanLikeApi.explorerApi);
        expect(explorerB).toBe(etherscanLikeApi.explorerApi);
      });

      it("should return the no cache etherscan api", () => {
        const explorerA = getExplorerApi({ id: "etherscan-coin-no-cache" } as any);
        const explorerB = getExplorerApi({ id: "blockscout-coin-no-cache" } as any);

        expect(explorerA).toBe(etherscanLikeApi.explorerApiNoCache);
        expect(explorerB).toBe(etherscanLikeApi.explorerApiNoCache);
      });

      it("should return the ledger api", () => {
        const explorerA = getExplorerApi({ id: "ledger-coin" } as any);

        expect(explorerA).toBe(ledgerExplorerApi);
      });
    });
  });
});
