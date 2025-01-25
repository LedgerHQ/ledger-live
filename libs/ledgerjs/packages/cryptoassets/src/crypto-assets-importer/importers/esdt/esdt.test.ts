import axios from "axios";
import { importESDTTokens } from ".";
import fs from "fs";

const esdtTokens = [
  {
    id: "elrond/esdt/555344432d633736663166",
    blockchain_name: "elrond",
    contract_address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
    decimals: 6,
    delisted: false,
    name: "WrappedUSDC",
    ticker: "USDC",
    live_signature:
      "3045022100f03b1ec0d83d8d75d436f688c2007ffb0c71b39a4f72aba036062ea8d7ade99402203449426b83203617279c04ccb00387a77deffc468c27015bfc1590f1950edde9",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import ESDT tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({ data: esdtTokens, headers: { etag: "etagHash" } }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
];

import tokens from "./esdt.json";

export { default as hash } from "./esdt-hash.json";

export default tokens as ElrondESDTToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importESDTTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "elrond",
          output: "ticker,id,decimals,live_signature,name",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "esdt.json",
      JSON.stringify([
        [
          "USDC",
          "555344432d633736663166",
          6,
          "3045022100f03b1ec0d83d8d75d436f688c2007ffb0c71b39a4f72aba036062ea8d7ade99402203449426b83203617279c04ccb00387a77deffc468c27015bfc1590f1950edde9",
          "WrappedUSDC",
        ],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "esdt-hash.json", JSON.stringify("etagHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "esdt.ts", expectedFile);
  });
});
