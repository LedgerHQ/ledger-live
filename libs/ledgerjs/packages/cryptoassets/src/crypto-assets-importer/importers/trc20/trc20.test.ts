import axios from "axios";
import { importTRC20Tokens } from ".";
import fs from "fs";

const trc20Tokens = [["id", "abbr", "name", "address", 18]];

const mockedAxios = jest.spyOn(axios, "get");

describe("import ESDT tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() => Promise.resolve({ data: trc20Tokens }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type TRC20Token = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // delisted
  string?, // ledgerSignature
  boolean?, // enableCountervalues
];

import tokens from "./trc20.json";

export default tokens as TRC20Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importTRC20Tokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/trc20.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(1, "trc20.json", JSON.stringify(trc20Tokens));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "trc20.ts", expectedFile);
  });
});
