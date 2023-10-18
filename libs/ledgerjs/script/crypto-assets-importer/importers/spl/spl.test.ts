import axios from "axios";
import { importSPLTokens } from ".";
import fs from "fs";

const splTokens = [["chainId", "symbol", "name", "address", 6, null]];

describe("import Spl tokens", () => {
  beforeEach(() => {
    const mockedAxios = jest.spyOn(axios, "get");
    mockedAxios.mockImplementation(() => Promise.resolve({ data: splTokens }));
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

export default tokens as SPLToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importSPLTokens(".");

    expect(mockedFs).toHaveBeenNthCalledWith(1, "spl.json", JSON.stringify(splTokens));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "spl.ts", expectedFile);
  });
});
