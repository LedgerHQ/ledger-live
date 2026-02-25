import BtcNew from "../../src/BtcNew";
import { createClient } from "./BtcNew.test";

// signMessage is a thin wrapper over the AppClient signMessage,
// decoding the base64 response into (v, r, s). We reuse the
// existing MockClient from BtcNew.test via createClient and
// override signMessage to return a controlled value.

describe("BtcNew.signMessage", () => {
  test("decodes base64 signature into v, r, s", async () => {
    const [client, transport] = await createClient();

    const mockSignature = Buffer.concat([
      // First byte: 27 + 4 + v where v = 1 => 32
      Buffer.from([32]),
      // r: 32 bytes of 0x11
      Buffer.alloc(32, 0x11),
      // s: 32 bytes of 0x22
      Buffer.alloc(32, 0x22),
    ]);

    client.signMessage = jest.fn(async (_message: Buffer, _pathElements: number[]) => {
      return mockSignature.toString("base64");
    });

    const btcNew = new BtcNew(client);
    const result = await btcNew.signMessage({ path: "m/44'/0'/0'/0/0", messageHex: "deadbeef" });

    expect(result.v).toBe(1);
    expect(result.r).toBe(Buffer.alloc(32, 0x11).toString("hex"));
    expect(result.s).toBe(Buffer.alloc(32, 0x22).toString("hex"));

    await transport.close();
  });
});
