import axios from "axios";
import { importFilecoinERC20Tokens } from ".";
import fs from "fs";

const filecoinERC20 = [
  {
    id: "filecoin/erc20/axelar_wrapped_usdc",
    blockchain_name: "filecoin",
    chain_id: 314,
    contract_address: "0xEB466342C4d449BC9f53A865D5Cb90586f405215",
    decimals: 6,
    delisted: false,
    name: "Axelar Wrapped USDC",
    ticker: "axlUSDC",
    live_signature:
      "3044022045ea1314b020f8e217f4cf5aa6bda23c29cbe41fbde96b04ac9b4c8d1fe2a6e802207bbd5d6029e8c57af71bf0121c714ad95216e8b24346bc6e46eb0c2dca1bb50f",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import filecoin ERC20 tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({ data: filecoinERC20, headers: { ["etag"]: "commitHash" } }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `import { ERC20Token } from "../types";

import tokens from "./filecoin-erc20.json";

export { default as hash } from "./filecoin-erc20-hash.json";

export default tokens as ERC20Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importFilecoinERC20Tokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: undefined,
          chain_id: 314,
          output:
            "blockchain_name,id,ticker,decimals,name,live_signature,contract_address,delisted",
          standard: "erc20",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "filecoin-erc20.json",
      JSON.stringify([
        [
          "filecoin",
          "axelar_wrapped_usdc",
          "AXLUSDC",
          6,
          "Axelar Wrapped USDC",
          "3044022045ea1314b020f8e217f4cf5aa6bda23c29cbe41fbde96b04ac9b4c8d1fe2a6e802207bbd5d6029e8c57af71bf0121c714ad95216e8b24346bc6e46eb0c2dca1bb50f",
          "0xEB466342C4d449BC9f53A865D5Cb90586f405215",
          false,
          false,
        ],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      2,
      "filecoin-erc20-hash.json",
      JSON.stringify("commitHash"),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(3, "filecoin-erc20.ts", expectedFile);
  });
});
