import axios from "axios";
import { importTokenByChainId } from ".";
import fs from "fs/promises";

const evmToken = [
  ["ethereum", "$aapl", "$AAPL", 18, "$AAPL", "signature", "address", true, false, null],
];

const evmTokenSignature = "signature";

describe("import EVM Token", () => {
  beforeEach(() => {
    const mockedAxios = jest.spyOn(axios, "get");
    mockedAxios.mockImplementation(url => {
      if (url.endsWith("erc20.json")) {
        return Promise.resolve({ data: evmToken, headers: { etag: "etagHash" } });
      } else if (url.endsWith("erc20-signatures.json")) {
        return Promise.resolve({ data: evmTokenSignature, headers: { etag: "signatureEtagHash" } });
      }

      return Promise.reject("Unexpected route call");
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const mockedFs = (fs.writeFile = jest.fn());

    await importTokenByChainId(".", 1);

    const expectedIndex = `export { default as tokens } from "./erc20.json";
export { default as signatures } from "./erc20-signatures.json";
export { default as hash } from "./erc20-hash.json";
export { default as signaturesHash } from "./erc20-signatures-hash.json";
`;

    expect(mockedFs).toHaveBeenNthCalledWith(1, "evm/1/erc20.json", JSON.stringify(evmToken));
    expect(mockedFs).toHaveBeenNthCalledWith(
      2,
      "evm/1/erc20-hash.json",
      JSON.stringify("etagHash"),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      3,
      "evm/1/erc20-signatures-hash.json",
      JSON.stringify("signatureEtagHash"),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(
      4,
      "evm/1/erc20-signatures.json",
      JSON.stringify(evmTokenSignature),
    );
    expect(mockedFs).toHaveBeenNthCalledWith(5, "evm/1/index.ts", expectedIndex);
  });
});
