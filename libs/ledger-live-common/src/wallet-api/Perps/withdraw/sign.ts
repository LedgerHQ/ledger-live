import { ethers } from "ethers";
import { filter, firstValueFrom, map } from "rxjs";
import type Transport from "@ledgerhq/hw-transport";
import {
  DmkSignerEth,
  LegacySignerEth,
  type EvmSignature,
  type EvmSigner,
  type EvmSignerEvent,
} from "@ledgerhq/live-signer-evm";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { Account, EIP712Message } from "@ledgerhq/types-live";
import type { Device } from "../../../hw/actions/types";
import { withDevice } from "../../../hw/deviceAccess";
import { isDmkTransport } from "../../../hw/dmkUtils";
import { WithdrawSignerMismatchError, WithdrawUnsupportedRouteError } from "./errors";
import type { WithdrawPayload } from "./schemas";

/** The app the withdraw is signed on: it clear-signs Hyperliquid's `sendAsset`. */
export const PERPS_WITHDRAW_SIGNING_APP_NAME = "Ethereum";

const DOMAIN_FIELD_TYPES: Record<string, string> = {
  name: "string",
  version: "string",
  chainId: "uint256",
  verifyingContract: "address",
  salt: "bytes32",
};

/**
 * Only the NEAR route is signed: its `sendAsset` has an Ethereum app descriptor,
 * while the Mayan typed data would be blind-signed.
 */
export function getWithdrawTypedData(payload: WithdrawPayload): EIP712Message {
  if (!("hyperCoreAction" in payload)) {
    throw new WithdrawUnsupportedRouteError("Only the sendAsset withdraw route can be signed");
  }
  const { domain, types, primaryType, message } = payload.hyperCoreAction.typedData;
  // SwapKit leaves the domain type out, and the Ethereum app needs it to hash the domain.
  const EIP712Domain =
    types.EIP712Domain ??
    Object.keys(DOMAIN_FIELD_TYPES)
      .filter(name => name in domain)
      .map(name => ({ name, type: DOMAIN_FIELD_TYPES[name] }));

  return { domain, types: { ...types, EIP712Domain }, primaryType, message };
}

/** Signs the withdraw typed data on the Ethereum app, already open on `device`. */
export async function signWithdrawTypedData(
  device: Device,
  account: Account,
  typedData: EIP712Message,
): Promise<string> {
  // Full EIP-712 only: the generic EVM message signer falls back to signing the hashes, which
  // the device cannot clear-sign.
  const { r, s, v } = await firstValueFrom(
    withDevice(
      device.deviceId,
      device.deviceName ? { matchDeviceByName: device.deviceName } : undefined,
    )(transport =>
      createSigner(transport)
        .signEIP712Message(account.freshAddressPath, typedData)
        .pipe(
          filter(isSignedEvent),
          map(event => event.value),
        ),
    ),
  ).catch((error: unknown) => {
    // The legacy Ethereum signer reports a rejection as a raw status; the DMK one maps it.
    if (isRefusalStatus(error)) throw new UserRefusedOnDevice();
    throw error;
  });
  const signature = ethers.Signature.from({
    r: `0x${r}`,
    s: `0x${s}`,
    v: typeof v === "string" ? parseInt(v, 16) : v,
  }).serialized;

  const { EIP712Domain: _domainType, ...types } = typedData.types;
  const signer = ethers.verifyTypedData(typedData.domain, types, typedData.message, signature);
  if (signer.toLowerCase() !== account.freshAddress.toLowerCase()) {
    throw new WithdrawSignerMismatchError(`Signed by ${signer}, expected ${account.freshAddress}`);
  }
  return signature;
}

function createSigner(transport: Transport): EvmSigner {
  return isDmkTransport(transport)
    ? new DmkSignerEth(transport.dmk, transport.sessionId)
    : new LegacySignerEth(transport);
}

function isSignedEvent(
  event: EvmSignerEvent,
): event is { type: "signer.evm.signed"; value: EvmSignature } {
  return event.type === "signer.evm.signed";
}

function isRefusalStatus(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "TransportStatusError" &&
    "statusCode" in error &&
    error.statusCode === 0x6985
  );
}
