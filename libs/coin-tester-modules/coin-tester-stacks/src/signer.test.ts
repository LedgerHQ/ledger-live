import { makeUnsignedSTXTokenTransfer, transactionToHex } from "@stacks/transactions-v7";
import { DEPLOYER_ADDRESS, DEPLOYER_PRIVATE_KEY } from "./fixtures";
import { buildStacksTestSigner } from "./signer";

describe("buildStacksTestSigner", () => {
  it("derives the known devnet deployer address and a well-formed public key", () => {
    const { address, publicKey } = buildStacksTestSigner(DEPLOYER_PRIVATE_KEY);

    expect(address).toBe(DEPLOYER_ADDRESS);
    expect(publicKey).toMatch(/^0[23][0-9a-f]{64}$/);
  });

  it("signs a real unsigned STX transfer and produces a 65-byte recoverable signature", async () => {
    const { publicKey, signer } = buildStacksTestSigner(DEPLOYER_PRIVATE_KEY);

    const unsignedTx = await makeUnsignedSTXTokenTransfer({
      recipient: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
      amount: 1000n,
      publicKey,
      fee: 200n,
      nonce: 0n,
      network: "testnet",
    });

    const result = await signer.sign(
      "m/44'/5757'/0'/0/0",
      Buffer.from(transactionToHex(unsignedTx), "hex"),
    );

    expect(result.signatureVRS).toHaveLength(65);
  });
});
