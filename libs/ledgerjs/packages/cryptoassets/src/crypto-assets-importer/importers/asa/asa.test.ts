import axios from "axios";
import { importAsaTokens } from ".";
import fs from "fs";

const asa = [["137594422", "HDL", "HEAD", "K3SN", 6, null]];

describe("import ASA tokens", () => {
  beforeEach(() => {
    const mockedAxios = jest.spyOn(axios, "get");
    mockedAxios.mockImplementation(() => Promise.resolve({ data: asa }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type AlgorandASAToken = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // enableCountervalues
];

import tokens from "./asa.json";

export default tokens as AlgorandASAToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importAsaTokens(".");

    expect(mockedFs).toHaveBeenNthCalledWith(1, "asa.json", JSON.stringify(asa));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "asa.ts", expectedFile);
  });
});
