import axios from "axios";
import { importCeloTokens } from ".";
import fs from "fs";

const celoTokens = [
  {
    id: "celo/erc20/celo_dollar",
    blockchain_name: "celo",
    name: "Celo Dollar",
    ticker: "CUSD",
    decimals: 18,
    live_signature:
      "3045022100bb27cb9143070f0414e9519f1f06a83a3fee31a9fb5ecf17a30575056c4991850220265e8843bcd6e02eddcb9b6f3f6ca29e2bd6dcf2e73ca3d18856938d2dd30d09",
    contract_address: "0x765de816845861e75a25fca122bb6898b8b1282a",
    delisted: false,
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import Celo ERC20 tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({ data: celoTokens, headers: { etag: "etagHash" } }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `import { ERC20Token } from "../types";

import tokens from "./celo.json";

export { default as hash } from "./celo-hash.json";

export default tokens as ERC20Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importCeloTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: undefined,
          chain_id: 42220,
          output:
            "blockchain_name,id,ticker,decimals,name,live_signature,contract_address,delisted",
          standard: "erc20",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "celo.json",
      JSON.stringify([
        [
          "celo",
          "celo_dollar",
          "CUSD",
          18,
          "Celo Dollar",
          "3045022100bb27cb9143070f0414e9519f1f06a83a3fee31a9fb5ecf17a30575056c4991850220265e8843bcd6e02eddcb9b6f3f6ca29e2bd6dcf2e73ca3d18856938d2dd30d09",
          "0x765de816845861e75a25fca122bb6898b8b1282a",
          false,
          false,
        ],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "celo-hash.json", JSON.stringify("etagHash"));

    const normalize = (str: string) => str.replace(/\r\n/g, "\n").trim();

    expect(normalize(mockedFs.mock.calls[2][1])).toBe(normalize(expectedFile));
  });
});
