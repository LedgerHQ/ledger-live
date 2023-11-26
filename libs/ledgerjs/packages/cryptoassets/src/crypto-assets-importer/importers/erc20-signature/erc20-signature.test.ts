import axios from "axios";
import { importERC20Signatures } from ".";
import fs from "fs";

const erc20Signatures = "erc20Signature";

describe("import Cardano Native tokens", () => {
  beforeEach(() => {
    const mockedAxios = jest.spyOn(axios, "get");
    mockedAxios.mockImplementation(() => Promise.resolve({ data: erc20Signatures }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `export default ${JSON.stringify(erc20Signatures, null, 2)};`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importERC20Signatures(".");

    expect(mockedFs).toHaveBeenNthCalledWith(
      1,
      "erc20-signatures.json",
      JSON.stringify(erc20Signatures),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(2, "erc20-signatures.ts", expectedFile);
  });
});
