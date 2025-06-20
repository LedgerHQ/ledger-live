import axios from "axios";
import { importCeloTokens } from ".";
import fs from "fs";

const celoTokens = [
  {
    blockchain_name: "celo",
    contract_address: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    decimals: 8,
    delisted: false,
    name: "Celo Dollar",
    ticker: "cUSD",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import Celo tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({ data: celoTokens, headers: { etag: "etagHash" } }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type CeloTokens = [
  string, // ticker
  number, // decimals
  string, // contractAddress
  string, // name
];

import tokens from "./celo.json";

export { default as hash } from "./celo-hash.json";

export default tokens as CeloTokens[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importCeloTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "celo",
          output: "ticker,decimals,contract_address,name",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "celo.json",
      JSON.stringify([["cUSD", 8, "0x765DE816845861e75A25fCA122bb6898B8B1282a", "Celo Dollar"]]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "celo-hash.json", JSON.stringify("etagHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "celo.ts", expectedFile);
  });
});
