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

describe("import poylgon erc20", () => {
  beforeEach(() => {
    const mockedAxios = jest.spyOn(axios, "get");
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

const tokens: PolygonERC20Token[] = ${JSON.stringify(poylgonErc20, null, 2)};

export default tokens;
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importPolygonTokens(".");

    expect(mockedFs).toHaveBeenNthCalledWith(1, "polygon-erc20.json", JSON.stringify(poylgonErc20));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "polygon-erc20.ts", expectedFile);
  });
});
