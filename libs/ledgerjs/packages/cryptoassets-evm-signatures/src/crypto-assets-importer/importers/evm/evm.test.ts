import axios from "axios";
import { importTokenByChainId } from ".";
import fs from "fs/promises";

const evmToken = [
  {
    id: "ethereum/erc20/usd__coin",
    blockchain_name: "ethereum",
    chain_id: 1,
    contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    delisted: false,
    name: "USD Coin",
    ticker: "USDC",
    live_signature:
      "3045022100b2e358726e4e6a6752cf344017c0e9d45b9a904120758d45f61b2804f9ad5299022015161ef28d8c4481bd9432c13562def9cce688bcfec896ef244c9a213f106cdd",
  },
];

describe("import EVM Token", () => {
  beforeEach(() => {
    const mockedAxios = jest.spyOn(axios, "get");
    mockedAxios.mockImplementation(() => {
      return Promise.resolve({
        data: evmToken,
        headers: { ["etag"]: "commitHash" },
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const mockedFs = (fs.writeFile = jest.fn());

    await importTokenByChainId(".", 1, ["ethereum/erc20/usd__coin"]);

    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "evm/1/erc20.json",
      JSON.stringify([
        [
          "ethereum",
          "usd__coin",
          "USDC",
          6,
          "USD Coin",
          "3045022100b2e358726e4e6a6752cf344017c0e9d45b9a904120758d45f61b2804f9ad5299022015161ef28d8c4481bd9432c13562def9cce688bcfec896ef244c9a213f106cdd",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          false,
          false,
        ],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      2,
      "evm/1/erc20-hash.json",
      JSON.stringify("commitHash"),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      3,
      "evm/1/erc20-signatures.json",
      `"AAAAaARVU0RDoLhpkcYhizbB0Z1KLp6wzjYG60gAAAAGAAAAATBFAiEAsuNYcm5OamdSzzRAF8Dp1FuakEEgdY1F9hsoBPmtUpkCIBUWHvKNjESBvZQywTVi3vnM5oi8/siW7yRMmiE/EGzd"`,
    );

    const expectedIndex = `import { ERC20Token } from "../../../types";
import erc20 from "./erc20.json";
export const tokens = erc20 as ERC20Token[];
export { default as signatures } from "./erc20-signatures.json";
export { default as hash } from "./erc20-hash.json";
`;

    expect(mockedFs).toHaveBeenNthCalledWith(4, "evm/1/index.ts", expectedIndex);
  });
});
