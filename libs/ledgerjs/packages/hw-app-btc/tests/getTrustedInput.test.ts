import type Transport from "@ledgerhq/hw-transport";
import { getTrustedInput } from "../src/getTrustedInput";
import { splitTransaction } from "../src/splitTransaction";

// getTrustedInput only reads the status-word-stripped payload back, so a stub that
// records every APDU body and answers with a two-byte result is enough here.
function recordingTransport(): { transport: Transport; sent: string[] } {
  const sent: string[] = [];
  const transport = {
    send: (_cla: number, _ins: number, _p1: number, _p2: number, data: Buffer) => {
      sent.push(data.toString("hex"));
      return Promise.resolve(Buffer.from("aabb9000", "hex"));
    },
  } as unknown as Transport;
  return { transport, sent };
}

// A transparent-only v6, trimmed to its header and transparent sections. Its
// shielded bundles are left off because splitTransaction does not read them.
const zcashV6Hex =
  "06000080" +
  "98b684d8" +
  "5b16a537" +
  "00000000" +
  "21533400" +
  "00" +
  "01" +
  "a8a4b6290f000000" +
  "19" +
  "76a914cc0fdf3f5cd0cede1ccba1791d66cc0468051d2188ac";

const zcashV5Hex =
  "050000800a27a7265510e7c8000000000000000001b5c51aa7f90bd40671eb4887f0022613f5c773f8a30e0c38ff9fc933b754a218000000006b483045022100b4b7b664f7ac6e78026f81f04f9c6fbd7ccbee532ba53e4150ccb6a7c0bd21510220277b4cfdf44683e77a4211e88a3052be00d1c678c36f357db935450c13f2f33701210223b8ffaccab6cc90d2164bfc4361bb058b030217e7cccf677347f075beeef3bb0000000001c0a79500000000001976a914168bb00f59a2d1a059d7e60fcc709cd5a979992988ac000000";

const zcashV4Hex =
  "0400008085202f890177507ef339c27d8d453723c568361fb93671f521f1ba2c42a0f136650939aaa5010000006b48304502210099a9fa0817083a1ce6f96404ed7366d9200f5533a9ccfcd4eddb50be4646c8a102205a6cccc8965f1ea45d6f32d96dda89a3cbb0422fad2a0e05b40fa51c0e51322a0121029f7331870af5630f14fe86e10b6ef696ee152bffb34e71396a4ce82ef64aa23effffffff0240781501000000001976a9144cf48844c49a77ba86e48b070f06151b712c862988ace39e0f02000000001976a91445110888402e6fd0c86329d9eda36c7a3fa354a588ac00000000000000000000000000000000000000";

describe("getTrustedInput", () => {
  it("refuses a Zcash v6 instead of streaming v5 shielded counters", async () => {
    const { transport, sent } = recordingTransport();
    const tx = splitTransaction(zcashV6Hex, true, true, ["zcash", "orchard"]);

    await expect(getTrustedInput(transport, 0, tx, ["zcash"])).rejects.toThrow(
      /Zcash v6 transactions are not supported/,
    );
    // The three-counter frame is the v4/v5 shape; a v6 needs a fourth counter for
    // the Ironwood actions, so emitting this one would leave the device reading
    // that fourth CompactSize out of the trailing data.
    expect(sent).not.toContain("000000");
  });

  it("streams the three shielded counters for a transparent v5", async () => {
    const { transport, sent } = recordingTransport();
    const tx = splitTransaction(zcashV5Hex, true, true, ["zcash", "sapling"]);

    await expect(getTrustedInput(transport, 0, tx, ["zcash"])).resolves.toBe("aabb");
    expect(sent).toContain("000000");
  });

  it("streams the three shielded counters for a v4", async () => {
    const { transport, sent } = recordingTransport();
    const tx = splitTransaction(zcashV4Hex, true, true, ["zcash", "sapling"]);

    await expect(getTrustedInput(transport, 0, tx, ["zcash"])).resolves.toBe("aabb");
    expect(sent).toContain("000000");
  });
});
