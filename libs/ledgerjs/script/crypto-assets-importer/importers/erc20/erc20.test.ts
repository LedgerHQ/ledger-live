import axios from "axios";
import { importERC20 } from ".";
import fs from "fs";

const erc20 = [["ethereum", "mytoken", "$TK", 8, "mytoken", "ledgersign", "0x0000", false, false]];

jest.mock("fs", () => ({
  writeFileSync: jest.fn().mockResolvedValue(() => {}),
}));

describe("import ERC20", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type ERC20Token = [
  string, // parent currecncy id
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

const tokens: ERC20Token[] = ${JSON.stringify(erc20, null, 2)}

export default tokens;
`;

    const mockedAxios = jest.spyOn(axios, "get");
    mockedAxios.mockImplementation(() => Promise.resolve({ data: erc20 }));
    const mockedFs = (fs.writeFileSync = jest.fn().mockImplementationOnce(() => expectedFile));

    await importERC20(".");

    expect(mockedFs).toHaveBeenNthCalledWith(1, "erc20.json", JSON.stringify(erc20));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "erc20.ts", JSON.stringify(erc20, null, 2));
  });
});
