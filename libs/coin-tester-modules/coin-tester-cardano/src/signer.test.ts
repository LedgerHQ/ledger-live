import * as cbors from "@stricahq/cbors";
import { Buffer } from "buffer";
import { buildSigner } from "./signer";

const PATH = "1852'/1815'/0'/0/0";

describe("software cardano signer", () => {
  it("derives a deterministic mainnet base address + raw 32-byte payment pubkey", async () => {
    const signer = await buildSigner();
    const { address, publicKey } = await signer.getAddress(PATH, 1);

    expect(address.startsWith("addr1")).toBe(true);
    expect(publicKey).toHaveLength(64); // 32 bytes, hex
    // deterministic across runs
    const again = await (await buildSigner()).getAddress(PATH, 1);
    expect(again.address).toBe(address);
  });

  it("derives a testnet address for networkId 0", async () => {
    const { address } = await (await buildSigner()).getAddress(PATH, 0);
    expect(address.startsWith("addr_test1")).toBe(true);
  });

  it("produces a 64-byte ed25519 signature over the tx body", async () => {
    const signer = await buildSigner();
    const unsignedTx = cbors.Encoder.encode([new Map(), new Map(), true, null]).toString("hex");

    const signature = await signer.signTransaction(PATH, unsignedTx);

    expect(signature).toHaveLength(128); // 64 bytes, hex
    expect(Buffer.from(signature, "hex")).toHaveLength(64);
  });
});
