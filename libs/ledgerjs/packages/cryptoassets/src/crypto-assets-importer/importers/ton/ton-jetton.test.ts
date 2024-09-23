import axios from "axios";
import fs from "fs";
import { importTonJettonTokens } from ".";

const tonJetton = [
  {
    contract_address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
    decimals: 6,
    delisted: false,
    name: "USDT",
    ticker: "USDT",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import ton Jetton tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: tonJetton,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type TonJettonToken = [
  string, // contractAddress
  string, // name
  string, // ticker
  number, // magntude
  boolean, // delisted
];

import tokens from "./ton-jetton.json";

export { default as hash } from "./ton-jetton-hash.json";

export default tokens as TonJettonToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importTonJettonTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "ton",
          output: "contract_address,name,ticker,decimals,delisted",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "ton-jetton.json",
      JSON.stringify([
        ["EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", "USDT", "USDT", 6, false],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      2,
      "ton-jetton-hash.json",
      JSON.stringify("commitHash"),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(3, "ton-jetton.ts", expectedFile);
  });
});
