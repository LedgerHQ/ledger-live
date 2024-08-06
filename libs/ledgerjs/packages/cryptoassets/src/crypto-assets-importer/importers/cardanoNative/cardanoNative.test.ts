import axios from "axios";
import { importCardanoNativeTokens } from ".";
import fs from "fs";

const cardanoNativeTokens = [
  {
    id: "cardano/native/f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344",
    blockchain_name: "cardano",
    chain_id: 1,
    token_identifier: "69555344",
    contract_address: "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880",
    decimals: 6,
    delisted: false,
    name: "iUSD",
    ticker: "iUSD",
    live_signature:
      "30450221009bf0f2bf3fc9580c89bc0d6cf386ad7c8be5e702e93e215c3b4315a8548923ad0220432b07d71fdb9c0759effb664028944af493534a7e79e4222209801104e89225",
  },
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import Cardano Native tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({
        data: cardanoNativeTokens,
        headers: { ["etag"]: "commitHash" },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type CardanoNativeToken = [
  "cardano", // parentCurrencyId
  string, // policyId
  string, // token identifier
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
  false, // [deprecated] disableCountervalue
];

import tokens from "./cardanoNative.json";

export { default as hash } from "./cardanoNative-hash.json";

export default tokens as CardanoNativeToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importCardanoNativeTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(
      "https://crypto-assets-service.api.ledger.com/v1/tokens",
      {
        params: {
          blockchain_name: "cardano",
          output: "contract_address,name,token_identifier,ticker,decimals,delisted",
        },
      },
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "cardanoNative.json",
      JSON.stringify([
        [
          "cardano",
          "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880",
          "69555344",
          "iUSD",
          "iUSD",
          6,
          false,
          false,
        ],
      ]),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      2,
      "cardanoNative-hash.json",
      JSON.stringify("commitHash"),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(3, "cardanoNative.ts", expectedFile);
  });
});
