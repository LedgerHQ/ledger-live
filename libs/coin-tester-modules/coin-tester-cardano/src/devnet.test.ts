import { adminGet } from "./yaci";
import { latestParams } from "./yaciIndexer";

jest.setTimeout(60_000);

describe("Yaci devnet", () => {
  it("runs protocol version 11.0", async () => {
    const params = await latestParams();

    expect(params).not.toBeNull();
    expect(params).toMatchObject({ protocol_major_ver: 11, protocol_minor_ver: 0 });
  });

  it("runs network magic 42", async () => {
    const devnet = await adminGet<{ protocolMagic: number }>("/admin/devnet");

    expect(devnet.protocolMagic).toBe(42);
  });
});
