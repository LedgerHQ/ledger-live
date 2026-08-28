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

function readDeviceError(error: unknown): DeviceError {
  if (typeof error !== "object" || error === null) return {};

  const { name, statusCode } = error as Record<"name" | "statusCode", unknown>;

  return {
    name: typeof name === "string" ? name : undefined,
    statusCode: typeof statusCode === "number" ? statusCode : undefined,
  };
}

function isUserRefusal({ name, statusCode }: DeviceError): boolean {
  if (name && USER_REFUSED_ERROR_NAMES.has(name)) return true;

  return statusCode !== undefined && USER_REFUSED_STATUS_CODES.has(statusCode);
}

export function mapGetAddressError(error: unknown): VerifyAddressDeviceState | undefined {
  const deviceError = readDeviceError(error);

  if (isUserRefusal(deviceError)) return { type: "refused" };
  if (deviceError.name === UNSUPPORTED_ERROR_NAME) {
    return { type: "unsupported", error: toError(error) };
  }

  return undefined;
}

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

        const mapped = mapGetAddressError(error);
        if (mapped) {
          subscriber.next(mapped);
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
