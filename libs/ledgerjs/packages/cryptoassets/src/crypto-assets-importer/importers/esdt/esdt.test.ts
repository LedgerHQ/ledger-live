import axios from "axios";
import { importESDTTokens } from ".";
import fs from "fs";

const esdtTokens = [["AERO", "id", 18, "signature", "name", false]];

const mockedAxios = jest.spyOn(axios, "get");

describe("import ESDT tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() => Promise.resolve({ data: esdtTokens }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
  boolean, // disableCountervalue
];

import tokens from "./esdt.json";

export default tokens as ElrondESDTToken[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importESDTTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/esdt.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(1, "esdt.json", JSON.stringify(esdtTokens));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "esdt.ts", expectedFile);
  });
});
