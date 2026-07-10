import { useMemo } from "react";
import type { Permission } from "@ledgerhq/wallet-api-core";
import type { AppManifest } from "../types";

export function usePermission(manifest: AppManifest): Omit<Permission, "currencyIds"> {
  return useMemo(
    () => ({
      methodIds: manifest.permissions,
    }),
    [manifest],
  );
}
