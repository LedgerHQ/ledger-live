import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getExplorerApi } from "../../api/explorer";
jest.mock("../../api/explorer/etherscan");
import etherscanLikeApi from "../../api/explorer/etherscan";
const mockedEtherscanLikeApi = jest.mocked(etherscanLikeApi);

describe("getExplorerApi", () => {
  it("should return etherscanLikeApi if explorer type is etherscan", () => {
    expect(
      getExplorerApi({
        ethereumLikeInfo: {
          explorer: {
            type: "etherscan",
          },
        },
      } as CryptoCurrency),
    ).toBe(mockedEtherscanLikeApi);
  });

  it("should return etherscanLikeApi if explorer type is blockscout", () => {
    expect(
      getExplorerApi({
        ethereumLikeInfo: {
          explorer: {
            type: "blockscout",
          },
        },
      } as CryptoCurrency),
    ).toBe(mockedEtherscanLikeApi);
  });

  it("should return etherscanLikeApi if explorer type is teloscan", () => {
    expect(
      getExplorerApi({
        ethereumLikeInfo: {
          explorer: {
            type: "teloscan",
          },
        },
      } as CryptoCurrency),
    ).toBe(mockedEtherscanLikeApi);
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
