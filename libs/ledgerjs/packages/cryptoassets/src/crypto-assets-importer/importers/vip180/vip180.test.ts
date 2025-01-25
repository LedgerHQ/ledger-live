import axios from "axios";
import { importVip180Tokens } from ".";
import fs from "fs";

const vip180Tokens = [
  {
    id: "vechain/vip180/vtho",
    blockchain_name: "vechain",
    contract_address: "0x0000000000000000000000000000456E65726779",
    decimals: 18,
    network_type: "main",
    delisted: false,
    name: "Vethor",
    ticker: "VTHO",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import Vip180 tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: vip180Tokens,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type Vip180Token = [
  string, // token identifier
  string, // ticker
  string, // name
  string, // contract address
  number, // decimals
];

import tokens from "./vip180.json";

export { default as hash } from "./vip180-hash.json";

export default tokens as Vip180Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importVip180Tokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "vechain",
          chain_id: undefined,
          output: "id,ticker,name,contract_address,decimals",
          standard: undefined,
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "vip180.json",
      JSON.stringify([
        ["vtho", "VTHO", "Vethor", "0x0000000000000000000000000000456E65726779", 18],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "vip180-hash.json", JSON.stringify("commitHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "vip180.ts", expectedFile);
  });
});
