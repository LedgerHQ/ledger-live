import axios from "axios";
import fs from "fs";
import { importStacksSip010Tokens } from ".";

const stacksSip010 = [
  {
    contract_address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4",
    name: "sbtc-token",
    ticker: "sBTC",
    decimals: 8,
    delisted: false
  }
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import stacks Sip010 tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: stacksSip010,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type StacksSip010Token = [
  string, // contractAddress
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
];

import tokens from "./stacks-sip010.json";

export { default as hash } from "./stacks-sip010-hash.json";

export default tokens as StacksSip010Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importStacksSip010Tokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "stacks",
          output: "contract_address,name,ticker,decimals,delisted",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "stacks-sip010.json",
      JSON.stringify([
        ["SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4", "sbtc-token", "sBTC", 8, false],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      2,
      "stacks-sip010-hash.json",
      JSON.stringify("commitHash"),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(3, "stacks-sip010.ts", expectedFile);
  });
});
