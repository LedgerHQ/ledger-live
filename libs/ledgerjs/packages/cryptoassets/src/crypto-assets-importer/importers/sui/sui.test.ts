import axios from "axios";
import { importSuiTokens } from ".";
import fs from "fs";

const suiTokens = [
  {
    id: "sui/sui/0x2::sui::SUI",
    blockchain_name: "sui",
    network: "sui",
    chain_id: 1,
    contract_address: "0x2::sui::SUI",
    decimals: 9,
    delisted: false,
    name: "Sui",
    ticker: "SUI",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import Sui tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: suiTokens,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type SuiToken = [
  string, // CAL id
  string, // name
  string, // ticker
  string, // address
  number, // decimals
];

import tokens from "./sui.json";

export { default as hash } from "./sui-hash.json";

export default tokens as SuiToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importSuiTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "sui",
          chain_id: undefined,
          output: "id,name,ticker,contract_address,decimals",
          standard: undefined,
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "sui.json",
      JSON.stringify([["sui/sui/0x2::sui::SUI", "Sui", "SUI", "0x2::sui::SUI", 9]]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "sui-hash.json", JSON.stringify("commitHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "sui.ts", expectedFile);
  });
});
