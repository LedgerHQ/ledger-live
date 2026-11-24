import { useMemo } from "react";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountReceive } from "@domain/entity-account-receive";
import type { AccountStatus } from "@domain/entity-account-status";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { DEFAULT_RECEIVE_FAMILY_CONFIG } from "../../logic/resolveReceiveFamilyConfig";
import type { ReceiveFamilyConfig, ReceiveFamilyConfigPort } from "../../types";

type Params = Readonly<{
  getFamilyConfig: ReceiveFamilyConfigPort | undefined;
  descriptor: AccountDescriptor | undefined;
  asset: Pick<CryptoOrTokenCurrency, "id" | "type"> | undefined;
  receive: AccountReceive | undefined;
  accountStatus: AccountStatus | undefined;
}>;

/**
 * The family's config over the defaults, read again as the account data arrives; `undefined`
 * until the family can be asked, so Verify does not start without its device exclusions.
 */
export function useReceiveFamilyConfig({
  getFamilyConfig,
  descriptor,
  asset,
  receive,
  accountStatus,
}: Params): ReceiveFamilyConfig | undefined {
  return useMemo(() => {
    if (!getFamilyConfig) return DEFAULT_RECEIVE_FAMILY_CONFIG;
    if (!descriptor || !asset) return undefined;
    return {
      ...DEFAULT_RECEIVE_FAMILY_CONFIG,
      ...getFamilyConfig({ descriptor, asset, receive, accountStatus }),
    };
  }, [getFamilyConfig, descriptor, asset, receive, accountStatus]);
}
