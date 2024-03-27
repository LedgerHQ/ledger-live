import axios from "axios";
import { importSPLTokens } from ".";
import fs from "fs";

const splTokens = [["chainId", "symbol", "name", "address", 6, null]];

const mockedAxios = jest.spyOn(axios, "get");

describe("import Spl tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({ data: splTokens, headers: { etag: "etagHash" } }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type SPLToken = [
  number, // chainId
  string, // name
  string, // symbol
  string, // address
  number, // decimals
  boolean?, // enableCountervalues
];

import tokens from "./spl.json";

export { default as hash } from "./spl-hash.json";

export default tokens as SPLToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importSPLTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/spl.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(1, "spl.json", JSON.stringify(splTokens));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "spl-hash.json", JSON.stringify("etagHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "spl.ts", expectedFile);
  });
});
