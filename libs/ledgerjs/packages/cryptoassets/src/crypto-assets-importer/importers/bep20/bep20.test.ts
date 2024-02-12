import axios from "axios";
import { importBEP20 } from ".";
import fs from "fs";

const bep20 = [["bsc", "(del)", "DEL", 18, "(DEL)", "ledgersign", "0xec00", false, false, null]];

const mockedAxios = jest.spyOn(axios, "get");

describe("import bep20", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() => Promise.resolve({ data: bep20 }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type BEP20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter value
  boolean, // delisted
  (string | null)?, // legacy
];

import tokens from "./bep20.json";

export default tokens as BEP20Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importBEP20(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/bep20.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(1, "bep20.json", JSON.stringify(bep20));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "bep20.ts", expectedFile);
  });
});
