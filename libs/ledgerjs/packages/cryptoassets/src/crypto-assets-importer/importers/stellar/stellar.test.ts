import axios from "axios";
import { importStellarTokens } from ".";
import fs from "fs";

const stellarTokens = [["USDC", "id", "stellar", "USDC", 7, true]];

const mockedAxios = jest.spyOn(axios, "get");

describe("import ESDT tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() => Promise.resolve({ data: stellarTokens }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  string, // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
  boolean, // enableCountervalues
];

import tokens from "./stellar.json";

export default tokens as StellarToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importStellarTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/stellar.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(1, "stellar.json", JSON.stringify(stellarTokens));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "stellar.ts", expectedFile);
  });
});
