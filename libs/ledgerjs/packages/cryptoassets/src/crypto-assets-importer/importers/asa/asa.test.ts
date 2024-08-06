import axios from "axios";
import { importAsaTokens } from ".";
import fs from "fs";

const asa = [
  {
    id: "algorand/asa/31566704",
    blockchain_name: "algorand",
    contract_address: "2UEQTE5QDNXPI7M3TU44G6SYKLFWLPQO7EBZM7K7MHMQQMFI4QJPLHQFHM",
    decimals: 6,
    delisted: false,
    name: "USDC",
    ticker: "USDC",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import ASA tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: asa,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type AlgorandASAToken = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
];

import tokens from "./asa.json";

export { default as hash } from "./asa-hash.json";

export default tokens as AlgorandASAToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importAsaTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "algorand",
          chain_id: undefined,
          output: "contract_address,token_identifier,decimals,name,ticker,live_signature",
          standard: undefined,
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "asa.json",
      JSON.stringify([
        [null, "USDC", "USDC", "2UEQTE5QDNXPI7M3TU44G6SYKLFWLPQO7EBZM7K7MHMQQMFI4QJPLHQFHM", 6],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "asa-hash.json", JSON.stringify("commitHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "asa.ts", expectedFile);
  });
});
