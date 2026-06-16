import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { Account, AnyMessage, DeviceId } from "@ledgerhq/types-live";
import type { Curve, TezosSigner } from "./types";
import { convertSecp256k1DERToRaw } from "@ledgerhq/coin-tezos/utils";

// Curve tag (matching hw-app-tezos `TezosCurves`) from the implicit-address prefix.
function curveForAddress(address: string): Curve {
  if (address.startsWith("tz1")) return 0x00;
  if (address.startsWith("tz2")) return 0x01;
  if (address.startsWith("tz3")) return 0x02;
  throw new Error("Tezos signMessage: account must be a tz1/tz2/tz3 implicit address");
}

/**
 * Sign an arbitrary, already-watermarked payload (`message` is its hex string). The first
 * byte is the magic byte the firmware reads as a dispatch tag and hashes with the rest, so
 * the bytes are signed verbatim — nothing is prepended. Returns the signature as raw 64-byte hex.
 */
export const signMessage =
  (signerContext: SignerContext<TezosSigner>) =>
  async (
    deviceId: DeviceId,
    account: Account,
    messageOptions: AnyMessage,
  ): Promise<{ signature: string }> => {
    const payloadHex = messageOptions.message;
    if (
      typeof payloadHex !== "string" ||
      payloadHex.length === 0 ||
      payloadHex.length % 2 !== 0 ||
      !/^[0-9a-fA-F]+$/.test(payloadHex)
    ) {
      throw new Error("Tezos signMessage: `message` must be a non-empty hex-encoded payload");
    }

    const curve = curveForAddress(account.freshAddress);
    const { signature } = await signerContext(deviceId, signer =>
      signer.signOperation(account.freshAddressPath, payloadHex, { curve }),
    );

    return { signature: convertSecp256k1DERToRaw(signature) };
  };
