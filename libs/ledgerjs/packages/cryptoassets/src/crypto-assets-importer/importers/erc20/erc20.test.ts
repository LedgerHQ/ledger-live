import axios from "axios";
import { importERC20 } from ".";
import fs from "fs";

const erc20 = [["ethereum", "mytoken", "$TK", 8, "mytoken", "ledgersign", "0x0000", false, false]];

const mockedAxios = jest.spyOn(axios, "get");

describe("import ERC20", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() => Promise.resolve({ data: erc20 }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type ERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter values
  boolean, // delisted
  (string | null)?, // countervalue_ticker (legacy)
  (string | null)?, // coumpound_for (legacy)
];

import tokens from "./erc20.json";

export default tokens as ERC20Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importERC20(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/erc20.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(1, "erc20.json", JSON.stringify(erc20));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "erc20.ts", expectedFile);
  });
});
