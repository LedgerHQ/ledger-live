import {
  createWalletPolicy,
  createProgressCallback,
  finalizePsbtAndExtract,
} from "../../src/signPsbt/signAndFinalize";
import { PsbtV2 } from "@ledgerhq/psbtv2";
import { finalize } from "../../src/newops/psbtFinalizer";
import { extract } from "../../src/newops/psbtExtractor";

jest.mock("../../src/newops/psbtFinalizer", () => ({
  finalize: jest.fn(),
}));
jest.mock("../../src/newops/psbtExtractor", () => ({
  extract: jest.fn(),
}));

describe("signAndFinalize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const masterFp = Buffer.from([1, 2, 3, 4]);
  const accountPath = [0x80000054, 0x80000000, 0x80000000];
  const accountXpub =
    "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT";

  describe("createWalletPolicy", () => {
    it("returns a WalletPolicy with descriptor from account type and key from masterFp, path and xpub", () => {
      const policy = createWalletPolicy(masterFp, accountPath, accountXpub, {
        getDescriptorTemplate: () => "wpkh(@0)",
      } as any);
      expect(policy.descriptorTemplate).toBe("wpkh(@0)");
      expect(policy.keys).toHaveLength(1);
      expect(policy.keys[0]).toContain(accountXpub);
      expect(policy.keys[0]).toContain(masterFp.toString("hex"));
    });
  });

  describe("createProgressCallback", () => {
    it("invokes onDeviceSignatureRequested once when callback is created", () => {
      const onDeviceSignatureRequested = jest.fn();
      createProgressCallback(2, { onDeviceSignatureRequested });
      expect(onDeviceSignatureRequested).toHaveBeenCalledTimes(1);
    });

    it("invokes onDeviceSignatureGranted only on first progress call", () => {
      const onDeviceSignatureGranted = jest.fn();
      const progress = createProgressCallback(1, { onDeviceSignatureGranted });
      progress();
      expect(onDeviceSignatureGranted).toHaveBeenCalledTimes(1);
      progress();
      progress();
      expect(onDeviceSignatureGranted).toHaveBeenCalledTimes(1);
    });

    it("reports progress via onDeviceStreaming with correct total and index", () => {
      const onDeviceStreaming = jest.fn();
      const progress = createProgressCallback(2, { onDeviceStreaming });
      progress();
      expect(onDeviceStreaming).toHaveBeenLastCalledWith({
        total: 4,
        index: 0,
        progress: 1 / 4,
      });
      progress();
      expect(onDeviceStreaming).toHaveBeenLastCalledWith({
        total: 4,
        index: 1,
        progress: 2 / 4,
      });
    });

    it("does not call onDeviceStreaming when option is omitted", () => {
      const progress = createProgressCallback(1, {});
      progress();
      progress();
      // No throw, and we can't assert on internal state; we've exercised the branch
      expect(() => progress()).not.toThrow();
    });

    it("should not call onDeviceStreaming when inputCount is 0", () => {
      const onDeviceStreaming = jest.fn();
      const progress = createProgressCallback(0, { onDeviceStreaming });
      progress();
      progress();
      expect(onDeviceStreaming).not.toHaveBeenCalled();
    });

    it("should not call onDeviceStreaming when inputCount is negative", () => {
      const onDeviceStreaming = jest.fn();
      const progress = createProgressCallback(-1, { onDeviceStreaming });
      progress();
      expect(onDeviceStreaming).not.toHaveBeenCalled();
    });
  });

  describe("finalizePsbtAndExtract", () => {
    it("finalizes and returns psbt + tx when shouldFinalize is true", () => {
      const psbt = { serialize: () => Buffer.from("010203", "hex") } as unknown as PsbtV2;
      jest.mocked(extract).mockReturnValue(Buffer.from("deadbeef", "hex"));
      const result = finalizePsbtAndExtract(psbt, true);
      expect(finalize).toHaveBeenCalledWith(psbt);
      expect(extract).toHaveBeenCalledWith(psbt);
      expect(result.psbt.toString("hex")).toBe("010203");
      expect(result.tx).toBe("deadbeef");
    });

    it("does not finalize and returns only psbt when shouldFinalize is false", () => {
      const psbt = { serialize: () => Buffer.from("aabb", "hex") } as unknown as PsbtV2;
      const result = finalizePsbtAndExtract(psbt, false);
      expect(finalize).not.toHaveBeenCalled();
      expect(extract).not.toHaveBeenCalled();
      expect(result.psbt.toString("hex")).toBe("aabb");
      expect(result.tx).toBeUndefined();
    });
  });
});
