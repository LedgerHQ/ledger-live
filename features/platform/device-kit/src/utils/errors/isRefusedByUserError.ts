import { RefusedByUserDAError } from "@ledgerhq/device-management-kit";
import { someNestedError } from "./internals";

export function isRefusedByUserError(error: unknown): boolean {
  return someNestedError(
    error,
    current =>
      current instanceof RefusedByUserDAError ||
      ("_tag" in current && current._tag === "RefusedByUserDAError"),
  );
}
