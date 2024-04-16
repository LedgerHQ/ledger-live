import axios from "axios";
import { importEIP712 } from ".";
import fs from "fs";

const eip712Tokens = {
  "1:address:signature": {
    contractName: {
      label: "DeGate Withdrawal",
      signature: "singatureDegate",
    },
    fields: [
      {
        label: "Owner",
        path: "owner",
        signature: "signatureOwner",
      },
    ],
  },
};

const mockedAxios = jest.spyOn(axios, "get");

describe("import EIP 712 tokens", () => {
  beforeEach(() => {
    mockedAxios.mockImplementation(() =>
      Promise.resolve({ data: eip712Tokens, headers: { etag: "etagHash" } }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output the file in the correct format", async () => {
    const expectedFile = `import EIP712 from "./eip712.json";
export { default as hash } from "./eip712-hash.json";
export default EIP712;
`;

    const mockedFs = (fs.writeFileSync = jest.fn());

    await importEIP712(".");

    expect(mockedAxios).toHaveBeenCalledWith(expect.stringMatching(/.*\/eip712.json/));
    expect(mockedFs).toHaveBeenNthCalledWith(1, "eip712.json", JSON.stringify(eip712Tokens));
    expect(mockedFs).toHaveBeenNthCalledWith(2, "eip712-hash.json", JSON.stringify("etagHash"));
    expect(mockedFs).toHaveBeenNthCalledWith(3, "eip712.ts", expectedFile);
  });
});
