import { computeTaprootOutputKey } from "../../src/newops/accounttype";

// Internal keys derived from the tpub in wallet-btc's taproot suite; expected output keys are the
// witness programs of the matching addresses, which came from `bitcoin-cli deriveaddresses`. So the
// ground truth is a bech32m decode of a bitcoind-generated address, not another @noble/curves call.
describe("computeTaprootOutputKey", () => {
  it.each([
    [
      "dc8d2f9eff0c4f4dbde070a48e330efc908b62a766568d91e658f284b324b878",
      "740ee64e452e3baee127b03c195bcc21ad3edded2ef26c5af483d9c56304d1e5",
    ],
    [
      "80c3c9aa95b580cd907ce5f6fd4e4fa4c3354b93196382b4bcab6da2a9beda04",
      "d6583481e19894e6302b0dce260c9953fbd69e5f86eea18dea181132c2dbadf6",
    ],
  ])("applies the BIP341 tweak to %s", (internal, expected) => {
    expect(computeTaprootOutputKey(Buffer.from(internal, "hex")).toString("hex")).toBe(expected);
  });

  it("rejects a pubkey that is not x-only", () => {
    expect(() => computeTaprootOutputKey(Buffer.alloc(33))).toThrow("Expected 32 byte pubkey");
  });
});
