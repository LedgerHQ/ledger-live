import axios from "axios";
import { importAptosTokens } from ".";
import fs from "fs";

const aptosTokens = [
  {
    id: "aptos/coin/aptos_coin_0x1::aptos_coin::aptoscoin",
    ticker: "APT",
    name: "Aptos Coin",
    contract_address: "0x1::aptos_coin::AptosCoin",
    decimals: 8,
    delisted: false,
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import APT tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: aptosTokens,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type AptosToken = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
];

import tokens from "./apt_coin.json";

export { default as hash } from "./apt_coin-hash.json";

export default tokens as AptosToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importAptosTokens(".", "coin");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "aptos",
          standard: "coin",
          output: "id,ticker,name,contract_address,decimals,delisted",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "apt_coin.json",
      JSON.stringify([
        [
          "aptos/coin/aptos_coin_0x1::aptos_coin::aptoscoin",
          "APT",
          "Aptos Coin",
          "0x1::aptos_coin::AptosCoin",
          8,
          false,
        ],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "apt_coin-hash.json", JSON.stringify("commitHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "apt_coin.ts", expectedFile);
  });
});
