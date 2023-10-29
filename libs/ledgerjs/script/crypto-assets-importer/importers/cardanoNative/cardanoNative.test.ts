import axios from "axios";
import { importCardanoNativeTokens } from ".";
import fs from "fs";

const cardanoNativeTokens = [
  ["cardano", "policyId", "assetName", "Pocket Change", "PTC", 0, false, false],
];

describe("import Cardano Native tokens", () => {
  beforeEach(() => {
    const mockedAxios = jest.spyOn(axios, "get");
    mockedAxios.mockImplementation(() => Promise.resolve({ data: cardanoNativeTokens }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type CardanoNativeToken = [
  string, // parentCurrencyId
  string, // policyId
  string, // assetName
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
  boolean // disableCountervalue
];

import tokens from "./cardanoNative.json";

export default tokens as CardanoNativeToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importCardanoNativeTokens(".");

    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "cardanoNative.json",
      JSON.stringify(cardanoNativeTokens),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "cardanoNative.ts", expectedFile);
  });
});
