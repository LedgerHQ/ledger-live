import axios from "axios";
import { importCW20Tokens } from ".";
import fs from "fs";

const cw20Tokens = [
  {
    id: "terra_classic/cw20/juris",
    blockchain_name: "terra_classic",
    contract_address: "terra1vhgq25vwuhdhn9xjll0rhl2s67jzw78a4g2t78y5kz89q9lsdskq2pxcj2",
    decimals: 6,
    network_type: "main",
    delisted: false,
    name: "Juris Protocol",
    ticker: "JURIS",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import CW20 tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: cw20Tokens,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type CW20Token = [
  string, // token identifier
  string, // ticker
  string, // name
  string, // contract address
  number, // decimals
];

import tokens from "./cw20.json";

export { default as hash } from "./cw20-hash.json";

export default tokens as CW20Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importCW20Tokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "terra_classic",
          chain_id: undefined,
          output: "id,ticker,name,contract_address,decimals",
          standard: undefined,
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "cw20.json",
      JSON.stringify([
        ["juris", "Juris", "Juris Protocol", "terra1vhgq25vwuhdhn9xjll0rhl2s67jzw78a4g2t78y5kz89q9lsdskq2pxcj2", 6],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "cw20-hash.json", JSON.stringify("commitHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "cw20.ts", expectedFile);
  });
});
