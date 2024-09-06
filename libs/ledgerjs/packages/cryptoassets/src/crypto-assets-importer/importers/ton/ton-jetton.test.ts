import axios from "axios";
import fs from "fs";
import { importTonJettonTokens } from ".";

const tonJetton = [
  ["EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", "Tether USD", "USD₮", 6, false, true],
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import ton Jetton tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({ data: tonJetton, headers: { etag: "etagHash" } }),
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
  boolean, // enableCountervalues
];

import tokens from "./ton-jetton.json";

export { default as hash } from "./ton-jetton-hash.json";

export default tokens as TonJettonToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importTonJettonTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/jetton.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(1, "ton-jetton.json", JSON.stringify(tonJetton));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "ton-jetton-hash.json", JSON.stringify("etagHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "ton-jetton.ts", expectedFile);
  });
});
