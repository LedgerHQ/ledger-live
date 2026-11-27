import assert from "node:assert/strict";
import test from "node:test";
import { Wallet } from "ethers";
import { assertSignedBy, signatureToHex } from "./perpsSignature";

const ADDRESS = "0x30Fb429E206729962c548b9a8d7E79095cC7E0E2";

const typedData = {
  domain: {
    name: "Exchange",
    version: "1",
    chainId: 1337,
    verifyingContract: `0x${"0".repeat(40)}`,
  },
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
    Agent: [
      { name: "source", type: "string" },
      { name: "connectionId", type: "bytes32" },
    ],
  },
  message: { source: "a", connectionId: `0x${"11".repeat(32)}` },
};

test("signatureToHex pads r and s and appends v", () => {
  assert.equal(
    signatureToHex({ r: "0x1", s: "2", v: 27 }),
    `0x${"1".padStart(64, "0")}${"2".padStart(64, "0")}1b`,
  );
});

test("assertSignedBy accepts the signer and rejects another address", async () => {
  const wallet = Wallet.createRandom();
  const { EIP712Domain: _domain, ...types } = typedData.types;
  const signature = await wallet.signTypedData(typedData.domain, types, typedData.message);

  assert.doesNotThrow(() => assertSignedBy(wallet.address, typedData, signature));
  assert.throws(() => assertSignedBy(ADDRESS, typedData, signature), /expected 0x30Fb/);
});

test("assertSignedBy rejects a transaction without an EIP-712 payload", () => {
  assert.throws(() => assertSignedBy(ADDRESS, undefined, "0x"), /No EIP-712 payload/);
});
