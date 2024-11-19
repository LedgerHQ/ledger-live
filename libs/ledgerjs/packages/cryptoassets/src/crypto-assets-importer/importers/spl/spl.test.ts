import axios from "axios";
import { importSPLTokens } from ".";
import fs from "fs";

const splTokens = [
  {
    id: "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v",
    blockchain_name: "solana",
    chain_id: 101,
    contract_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    delisted: false,
    name: "USD Coin",
    ticker: "USDC",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import Spl tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: splTokens,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type SPLToken = [
  number, // chainId
  string, // name
  string, // ticker
  string, // address
  number, // decimals
];

import tokens from "./spl.json";

export { default as hash } from "./spl-hash.json";

export default tokens as SPLToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importSPLTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "solana",
          chain_id: undefined,
          output: "chain_id,name,ticker,contract_address,decimals",
          standard: undefined,
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "spl.json",
      JSON.stringify([
        [101, "USD Coin", "USDC", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 6],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "spl-hash.json", JSON.stringify("commitHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "spl.ts", expectedFile);
  });
});
