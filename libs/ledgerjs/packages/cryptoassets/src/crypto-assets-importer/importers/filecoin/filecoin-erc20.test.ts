import axios from "axios";
import { importFilecoinERC20Tokens } from ".";
import fs from "fs";

const filecoinERC20 = [
  [
    "filecoin",
    "axelar_wrapped_usdc",
    "AXLUSDC",
    6,
    "Axelar Wrapped USDC",
    "3044022045ea1314b020f8e217f4cf5aa6bda23c29cbe41fbde96b04ac9b4c8d1fe2a6e802207bbd5d6029e8c57af71bf0121c714ad95216e8b24346bc6e46eb0c2dca1bb50f",
    "0xEB466342C4d449BC9f53A865D5Cb90586f405215",
    false,
    false,
    null,
  ],
];

const mockedAxios = jest.spyOn(axios, "get");

describe("import filecoin ERC20 tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({ data: filecoinERC20, headers: { etag: "etagHash" } }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export type FilecoinERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract eth address
  //   string, // contract fil address
  boolean, // disabled counter values
  boolean, // delisted
  (string | null)?, // countervalue_ticker (legacy)
];

import tokens from "./filecoin-erc20.json";

export { default as hash } from "./filecoin-erc20-hash.json";

export default tokens as FilecoinERC20Token[];
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importFilecoinERC20Tokens(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/evm\/314\/erc20.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "filecoin-erc20.json",
      JSON.stringify(filecoinERC20),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      2,
      "filecoin-erc20-hash.json",
      JSON.stringify("etagHash"),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(3, "filecoin-erc20.ts", expectedFile);
  });
});
