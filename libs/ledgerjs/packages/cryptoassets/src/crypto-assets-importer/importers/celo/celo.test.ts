import axios from "axios";
import { importCeloTokens } from ".";
import fs from "fs";

const celoTokens = [
  {
    blockchain_name: "celo",
    name: "Celo Dollar",
    ticker: "cUSD",
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
          blockchain_name: "celo",
          output: "ticker,decimals,contract_address,name",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "./celo.json",
      JSON.stringify([["cUSD", 18, "0x765de816845861e75a25fca122bb6898b8b1282a", "Celo Dollar"]]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "./celo-hash.json", JSON.stringify("etagHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "./celo.ts", expectedFile);
  });
});
