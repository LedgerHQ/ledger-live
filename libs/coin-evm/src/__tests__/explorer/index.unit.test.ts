import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getExplorerApi } from "../../api/explorer";
jest.mock("../../api/explorer/etherscan");
import etherscanLikeApi from "../../api/explorer/etherscan";
const mockedEtherscanLikeApi = jest.mocked(etherscanLikeApi);

describe("getExplorerApi", () => {
  const cases = [
    ["etherscan", mockedEtherscanLikeApi],
    ["blockscout", mockedEtherscanLikeApi],
    ["teloscan", mockedEtherscanLikeApi],
  ];

  it.each(cases)("should return right explorer api for %p", (apiType, expectedExplorerApi) => {
    const explorerApi = getExplorerApi({
      ethereumLikeInfo: {
        explorer: {
          type: apiType,
        },
      },
    } as CryptoCurrency);
    expect(explorerApi).toBe(expectedExplorerApi);
  });

  it("should throw an error if explorer type is unknown", () => {
    expect(() =>
      getExplorerApi({
        ethereumLikeInfo: {
          explorer: {
            type: "unknowntypeofexplorer",
          },
        },
      } as unknown as CryptoCurrency),
    ).toThrowError();
  });

  it("should throw an error if explorer is undefined", () => {
    expect(() =>
      getExplorerApi({
        ethereumLikeInfo: {},
      } as CryptoCurrency),
    ).toThrowError();
  });

  it("should give currency id when error is thrown", () => {
    expect(() =>
      getExplorerApi({
        id: "bitcoin",
      } as CryptoCurrency),
    ).toThrowError("bitcoin");
  });
});
