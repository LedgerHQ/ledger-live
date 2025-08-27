import axios from "axios";
import { importHederaTokens } from ".";
import fs from "fs";

const hederaTokens = [
  {
    id: "hedera/hts/hbark_0.0.5022567",
    contract_address: "0.0.5022567",
    decimals: 0,
    network: "hedera",
    delisted: false,
    name: "hBARK",
    ticker: "hBARK",
    blockchain_name: "hedera",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import Hedera tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: hederaTokens,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type HederaToken = [
  string, // id
  string, // tokenId
  string, // name
  string, // ticker
  string, // network
  number, // decimals
  boolean, // delisted
];

import tokens from "./hedera.json";

export { default as hash } from "./hedera-hash.json";

export default tokens as HederaToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importHederaTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "hedera",
          output: "id,contract_address,name,ticker,network,decimals,delisted",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "hedera.json",
      JSON.stringify([
        ["hedera/hts/hbark_0.0.5022567", "0.0.5022567", "hBARK", "hBARK", "hedera", 0, false],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "hedera-hash.json", JSON.stringify("commitHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "hedera.ts", expectedFile);
  });
});
