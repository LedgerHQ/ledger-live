import { MockTransport } from "@ledgerhq/hw-transport-mocker";
import getAppAndVersion from "./getAppAndVersion";

describe("getAppAndVersion", () => {
  it.each([
    {
      apdus: "0105424f4c4f5305312e322e319000",
      expectedResult: {
        name: "BOLOS",
        version: "1.2.1",
        flags: Buffer.from([0x00]),
      },
    },
    {
      apdus: "010845786368616e67650b342e312e302d706b69763201029000",
      expectedResult: {
        name: "Exchange",
        version: "4.1.0-pkiv2",
        flags: Buffer.from([0x02]),
      },
    },
  ])("should return the correct app and version", async ({ apdus, expectedResult }) => {
    const mockTransport = new MockTransport(Buffer.from(apdus, "hex"));

    const result = await getAppAndVersion(mockTransport);

    expect(result).toEqual(expectedResult);
  });
});
