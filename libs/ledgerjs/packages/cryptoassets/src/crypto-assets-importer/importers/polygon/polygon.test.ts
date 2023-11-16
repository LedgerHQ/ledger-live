import axios from "axios";
import { importPolygonTokens } from ".";
import fs from "fs";

const poylgonErc20 = [
  [
    "polygon",
    "(del)",
    "DEL",
    18,
    "(DEL)",
    "ledgerSignature",
    "0xcontractAddress",
    false,
    false,
    null,
  ],
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import poylgon erc20", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() => Promise.resolve({ data: poylgonErc20 }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type PolygonERC20Token = [
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
  (string | null)?, // legacy
];

import tokens from "./polygon-erc20.json";

export default tokens as PolygonERC20Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importPolygonTokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/polygon-erc20.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(1, "polygon-erc20.json", JSON.stringify(poylgonErc20));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "polygon-erc20.ts", expectedFile);
  });
});
