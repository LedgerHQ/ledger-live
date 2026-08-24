import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { StatusCodes } from "@ledgerhq/hw-transport";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { Observable } from "rxjs";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { DerivationMode } from "@ledgerhq/types-live";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type {
  VerifyAddressDeviceAction,
  VerifyAddressDeviceState,
} from "@features/platform-verify-address-intent";

const USER_REFUSED_ERROR_NAMES = new Set(["UserRefusedAddress", "UserRefusedOnDevice"]);

/**
 * Status words that both mean "the user declined on the device": the generic one
 * most coin apps answer with, and the OS-level one some apps return instead.
 */
const USER_REFUSED_STATUS_CODES = new Set<number>([
  StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED,
  StatusCodes.USER_REFUSED_ON_DEVICE,
]);

const UNSUPPORTED_ERROR_NAME = "DeviceAppVerifyNotSupported";

type Params = Readonly<{
  currency: CryptoCurrency;
  path: string;
  derivationMode: DerivationMode;
}>;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

type DeviceError = Readonly<{ name?: string; statusCode?: number }>;

/**
 * Reads the two fields we classify on. Signers throw from several packages (and
 * duplicated copies of `@ledgerhq/errors` defeat `instanceof` across workspace
 * boundaries), so the error is duck-typed rather than matched on its class.
 */
function readDeviceError(error: unknown): DeviceError {
  if (typeof error !== "object" || error === null) return {};

  const { name, statusCode } = error as Record<"name" | "statusCode", unknown>;

  return {
    name: typeof name === "string" ? name : undefined,
    statusCode: typeof statusCode === "number" ? statusCode : undefined,
  };
}

/**
 * A refusal reaches us either already named by a signer that maps it, or as a raw
 * status word. The status word is conclusive on its own: whatever class carries
 * it, the device answered that the user declined.
 */
function isUserRefusal({ name, statusCode }: DeviceError): boolean {
  if (name && USER_REFUSED_ERROR_NAMES.has(name)) return true;

  return statusCode !== undefined && USER_REFUSED_STATUS_CODES.has(statusCode);
}

/**
 * Single verification path for every coin family.
 *
 * It runs the generic `getAddress` resolver over a {@link DmkCompatTransport}
 * built from the live DIE session. That resolver dispatches to each family's
 * coin-module signer, which itself picks the DMK-native signer when the family
 * has one wired and its `ldmk*Signer` flag allows it (EVM always, Solana via
 * `ldmkSolanaSigner`, Cosmos via `ldmkCosmosSigner`, …), and the legacy signer
 * otherwise — all over the same DMK transport under the hood. So this stays
 * signer-agnostic and needs no per-family branching here.
 *
 * Rejections reach us under several shapes depending on the signer: the legacy
 * resolver normalizes them to `UserRefusedAddress`, DMK-native signers throw
 * `UserRefusedOnDevice`, and some families let the raw `TransportStatusError`
 * through. All of them map to `refused`, an unsupported on-device display maps
 * to `unsupported`, and anything else escapes as an error.
 * The device-derived address is returned so the job can compare it against the
 * expected one and surface a rich `mismatch`.
 */
export function getAddressVerification(
  { dmk, sessionId }: DeviceConnectionResult,
  { currency, path, derivationMode }: Params,
): VerifyAddressDeviceAction {
  let cancelled = false;

  const observable = new Observable<VerifyAddressDeviceState>(subscriber => {
    subscriber.next({ type: "awaiting-confirmation" });

    getAddress(new DmkCompatTransport(dmk, sessionId), {
      currency,
      path,
      derivationMode,
      verify: true,
    })
      .then(result => {
        if (cancelled) return;
        subscriber.next({ type: "confirmed", address: result.address });
        subscriber.complete();
      })
      .catch(error => {
        if (cancelled) return;

        const deviceError = readDeviceError(error);

        if (isUserRefusal(deviceError)) {
          subscriber.next({ type: "refused" });
          subscriber.complete();
          return;
        }
        if (deviceError.name === UNSUPPORTED_ERROR_NAME) {
          subscriber.next({ type: "unsupported", error: toError(error) });
          subscriber.complete();
          return;
        }
        subscriber.error(toError(error));
      });

    return () => {
      cancelled = true;
    };
  });

  return {
    observable,
    cancel: () => {
      cancelled = true;
    },
  };
}
