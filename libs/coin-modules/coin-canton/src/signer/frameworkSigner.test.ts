import { InvalidTransactionError } from "@ledgerhq/coin-module-framework/errors";
import { splitTransaction } from "@ledgerhq/hw-app-canton";
import { createMockPrepareTransferResponse } from "../test/fixtures";
import type { CantonSigner } from "../types/signer";
import { createFrameworkSigner } from "./frameworkSigner";

const PATH = "44'/6767'/0'/0'/0'";
const PARTY = "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000";
const { serialized, json } = createMockPrepareTransferResponse();
const crafted = JSON.stringify({ party: PARTY, serialized, json });

const deviceSigner = (signature = "device-signature") => ({
  getAddress: jest.fn().mockResolvedValue({ publicKey: "pk", address: "canton_addr", path: PATH }),
  signTransaction: jest.fn().mockResolvedValue({ signature }),
});

describe("createFrameworkSigner", () => {
  it("should hand the device the split transaction and return its signature", async () => {
    const signer = deviceSigner();

    const signature = await createFrameworkSigner(signer).signTransaction(PATH, crafted);

    expect(signer.signTransaction).toHaveBeenCalledWith(PATH, splitTransaction(json));
    expect(typeof signer.signTransaction.mock.calls[0][1]).toBe("object");
    expect(signature).toBe("device-signature");
  });

  it("should not reach the device with an onboarding-shaped transaction", async () => {
    const signer = deviceSigner();
    const onboarding = JSON.stringify({
      party: PARTY,
      serialized,
      json: { ...json, transactions: [] },
    });

    await expect(createFrameworkSigner(signer).signTransaction(PATH, onboarding)).rejects.toThrow(
      InvalidTransactionError,
    );
    expect(signer.signTransaction).not.toHaveBeenCalled();
  });

  it("should reject an empty device signature", async () => {
    await expect(
      createFrameworkSigner(deviceSigner("")).signTransaction(PATH, crafted),
    ).rejects.toThrow("Device returned empty signature");
  });

  it.each([
    ["verify is set", { verify: true }, true],
    ["only framework options are passed", { derivationMode: "canton" }, false],
    ["no options are passed", undefined, false],
  ])("should display the address only when %s", async (_, options, display) => {
    const signer: CantonSigner = deviceSigner();

    await createFrameworkSigner(signer).getAddress(PATH, options);

    expect(signer.getAddress).toHaveBeenCalledWith(PATH, display);
  });
});
