import axios from "axios";
import { importStellarTokens } from ".";
import fs from "fs";

const stellarTokens = [
  {
    id: "stellar/asset/usdc:ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn",
    blockchain_name: "stellar",
    contract_address: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    decimals: 7,
    delisted: false,
    name: "USDC",
    ticker: "USDC",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import Stellar tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: stellarTokens,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  "stellar", // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
];

import tokens from "./stellar.json";

export { default as hash } from "./stellar-hash.json";

export default tokens as StellarToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importStellarTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      { params: { blockchain_name: "stellar", output: "ticker,contract_address,name,decimals" } },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "stellar.json",
      JSON.stringify([
        ["usdc", "ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn", "stellar", "USDC", 7],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "stellar-hash.json", JSON.stringify("commitHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "stellar.ts", expectedFile);
  });
});
