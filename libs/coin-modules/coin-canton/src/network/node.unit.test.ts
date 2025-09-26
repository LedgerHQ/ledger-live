// myModule.test.ts
import { getLedgerEnd, generateJWT } from "./node";
import coinConfig from "../config";

jest.mock("@ledgerhq/live-network", () => jest.fn().mockResolvedValue({ data: { offset: 12345 } }));

describe("generateJWT", () => {
  it("should generate a valid JWT format", () => {
    const jwt = generateJWT();
    expect(jwt.split(".")).toHaveLength(3);
  });
});

describe("getLedgerEnd", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      nodeUrl: "http://node-url",
      networkType: "mainnet",
      nativeInstrumentId: "Amulet",
      status: {
        type: "active",
      },
    }));
  });

  it("should return the ledger offset from API response", async () => {
    const result = await getLedgerEnd();
    expect(result).toBe(12345);
  });
});
