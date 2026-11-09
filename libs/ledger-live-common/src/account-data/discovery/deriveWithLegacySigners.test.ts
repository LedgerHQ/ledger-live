import { Observable, of } from "rxjs";
import { candidateOf } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { deriveWithLegacySigners } from "./deriveWithLegacySigners";
import { LegacyDeriveUnsupportedError } from "./errors";

const loadSetupForFamily = jest.fn();
const getAccountDescriptorType = jest.fn(() => "address");
jest.mock("../../coin-modules/registry", () => ({
  loadSetupForFamily: (family: string) => loadSetupForFamily(family),
  getAccountDescriptorType: () => getAccountDescriptorType(),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const candidate = candidateOf(bitcoin, "native_segwit", 0);

describe("deriveWithLegacySigners", () => {
  it("uses the family's own derivation when it has one", async () => {
    const descriptor = { type: "utxo" };
    const deriveAccountDescriptor = jest.fn(() => of(descriptor));
    loadSetupForFamily.mockResolvedValue({ deriveAccountDescriptor });
    const derive = deriveWithLegacySigners("device");
    await expect(derive(candidate, new AbortController().signal)).resolves.toBe(descriptor);
    expect(deriveAccountDescriptor).toHaveBeenCalledWith("device", bitcoin, candidate);
  });

  it("releases the device once the scan aborts", async () => {
    const teardown = jest.fn();
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: () => new Observable(() => teardown),
    });
    const controller = new AbortController();
    const pending = deriveWithLegacySigners("device")(candidate, controller.signal);
    await new Promise(resolve => setTimeout(resolve, 0));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(teardown).toHaveBeenCalled();
  });

  it("fails for a family known by an xpub without its own derivation", async () => {
    loadSetupForFamily.mockResolvedValue({});
    getAccountDescriptorType.mockReturnValueOnce("utxo");
    await expect(
      deriveWithLegacySigners("device")(candidate, new AbortController().signal),
    ).rejects.toBeInstanceOf(LegacyDeriveUnsupportedError);
  });
});
