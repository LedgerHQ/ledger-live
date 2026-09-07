import { Observable } from "rxjs";
import type { VerifyAddressDeviceAction, VerifyAddressDeviceState } from "./types";

const USER_REFUSED_ERROR_NAMES = new Set(["UserRefusedAddress", "UserRefusedOnDevice"]);
const CONDITIONS_OF_USE_NOT_SATISFIED = 0x6985;
const USER_REFUSED_ON_DEVICE = 0x5501;

const USER_REFUSED_STATUS_CODES = new Set<number>([
  CONDITIONS_OF_USE_NOT_SATISFIED,
  USER_REFUSED_ON_DEVICE,
]);
const UNSUPPORTED_ERROR_NAME = "DeviceAppVerifyNotSupported";

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

type DeviceError = Readonly<{ name?: string; statusCode?: number }>;

/** Reads `name` and `statusCode`. `instanceof` fails across duplicated `@ledgerhq/errors`. */
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

function mapVerifyAddressError(error: unknown): VerifyAddressDeviceState | undefined {
  const deviceError = readDeviceError(error);

  if (isUserRefusal(deviceError)) return { type: "refused" };
  if (deviceError.name === UNSUPPORTED_ERROR_NAME) {
    return { type: "unsupported", error: toError(error) };
  }

  return undefined;
}

export function getAddressVerification(
  verify: () => Promise<{ address: string }>,
): VerifyAddressDeviceAction {
  let cancelled = false;

  const observable = new Observable<VerifyAddressDeviceState>(subscriber => {
    subscriber.next({ type: "awaiting-confirmation" });

    verify()
      .then(result => {
        if (cancelled) return;
        subscriber.next({ type: "confirmed", address: result.address });
        subscriber.complete();
      })
      .catch(error => {
        if (cancelled) return;

        const mapped = mapVerifyAddressError(error);
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
