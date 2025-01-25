import axios from "axios";
import { importTRC20Tokens } from ".";
import fs from "fs";

const trc20Tokens = [
  {
    id: "tron/trc20/tekxitehnzsmse2xqrbj4w32run966rdz8",
    blockchain_name: "tron",
    contract_address: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
    decimals: 6,
    delisted: false,
    name: "USDCoin",
    ticker: "USDC",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import ESDT tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: trc20Tokens,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type TRC20Token = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
  string?, // live signature
];

import tokens from "./trc20.json";

export { default as hash } from "./trc20-hash.json";

export default tokens as TRC20Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importTRC20Tokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "tron",
          output: "id,ticker,name,contract_address,decimals,delisted,live_signature",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "trc20.json",
      JSON.stringify([
        [
          "tekxitehnzsmse2xqrbj4w32run966rdz8",
          "USDC",
          "USDCoin",
          "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
          6,
          false,
          null,
        ],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "trc20-hash.json", JSON.stringify("commitHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "trc20.ts", expectedFile);
  });
});
