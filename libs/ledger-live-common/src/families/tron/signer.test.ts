import { createSigner } from "./signer";

const getAddress = jest.fn().mockResolvedValue({ address: "TAddr", publicKey: "pub" });
const signTransaction = jest.fn().mockResolvedValue("deadbeef");

jest.mock("@ledgerhq/hw-app-trx", () => ({
  __esModule: true,
  default: class {
    getAddress = getAddress;
    signTransaction = signTransaction;
  },
}));

// `SignerContext<S>` erases the signer's shape at the framework's call sites, so neither of the
// mismatches these tests pin would be a compile error — only a failure on a real device.
describe("tron signer adapter", () => {
  const signer = () => createSigner({} as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signTransaction", () => {
    it("sends the CAL signature for a TRC-10 token, so the device can clear-sign its name", async () => {
      await signer().signTransaction("44'/195'/0'/0/0", "abcd", {
        token: { id: "tron/trc10/1002000", ledgerSignature: "cafe" },
      });

      expect(signTransaction).toHaveBeenCalledWith("44'/195'/0'/0/0", "abcd", ["cafe"]);
    });

    it("sends no token signature for a TRC-20 token", async () => {
      await signer().signTransaction("44'/195'/0'/0/0", "abcd", {
        token: { id: "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t", ledgerSignature: "cafe" },
      });

      expect(signTransaction).toHaveBeenCalledWith("44'/195'/0'/0/0", "abcd", []);
    });

    it("matches the TRC-10 id prefix, not the substring, so another standard cannot opt in", async () => {
      await signer().signTransaction("44'/195'/0'/0/0", "abcd", {
        token: { id: "tron/trc20/trc10lookalike", ledgerSignature: "cafe" },
      });

      expect(signTransaction).toHaveBeenCalledWith("44'/195'/0'/0/0", "abcd", []);
    });

    it("sends no signature for a native send, or when the token has none in CAL", async () => {
      await signer().signTransaction("44'/195'/0'/0/0", "abcd");
      await signer().signTransaction("44'/195'/0'/0/0", "abcd", {
        token: { id: "tron/trc10/1002000" },
      });

      expect(signTransaction).toHaveBeenNthCalledWith(1, "44'/195'/0'/0/0", "abcd", []);
      expect(signTransaction).toHaveBeenNthCalledWith(2, "44'/195'/0'/0/0", "abcd", []);
    });
  });

  describe("getAddress", () => {
    it("does not ask the device to display the address when the framework passes its options object", async () => {
      // `signOperation.ts` passes `{ derivationMode }` — an object carrying no `verify` at all, which
      // only type-checks here because the erasure above lets it through.
      await signer().getAddress("44'/195'/0'/0/0", { derivationMode: "" } as never);

      expect(getAddress).toHaveBeenCalledWith("44'/195'/0'/0/0", false);
    });

    it("does not ask the device to display the address when no options are passed at all", async () => {
      // `signRawOperation.ts` calls `getAddress(derivationPath)` with no second argument.
      await signer().getAddress("44'/195'/0'/0/0");

      expect(getAddress).toHaveBeenCalledWith("44'/195'/0'/0/0", false);
    });

    it("treats an explicit verify:false the same way", async () => {
      await signer().getAddress("44'/195'/0'/0/0", { verify: false } as never);

      expect(getAddress).toHaveBeenCalledWith("44'/195'/0'/0/0", false);
    });

    it("still honours an explicit verify request", async () => {
      await signer().getAddress("44'/195'/0'/0/0", { verify: true } as never);

      expect(getAddress).toHaveBeenCalledWith("44'/195'/0'/0/0", true);
    });

    it("accepts the plain boolean the coin-module resolver passes", async () => {
      await signer().getAddress("44'/195'/0'/0/0", true);

      expect(getAddress).toHaveBeenCalledWith("44'/195'/0'/0/0", true);
    });
  });
});
