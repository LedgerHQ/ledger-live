import axios from "axios";
import { importERC20Signatures } from ".";
import fs from "fs";

const erc20Signatures = "erc20Signature";

describe("import Cardano Native tokens", () => {
  beforeEach(() => {
    const mockedAxios = jest.spyOn(axios, "get");
    mockedAxios.mockImplementation(() =>
      Promise.resolve({ data: erc20Signatures, headers: { etag: "etagHash" } }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `import ERC20Signatures from "./erc20-signatures.json";

export { default as hash } from "./erc20-signatures-hash.json";

export default ERC20Signatures;
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importERC20Signatures(".");

    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "erc20-signatures.json",
      JSON.stringify(erc20Signatures),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      2,
      "erc20-signatures-hash.json",
      JSON.stringify("etagHash"),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(3, "erc20-signatures.ts", expectedFile);
  });
});
