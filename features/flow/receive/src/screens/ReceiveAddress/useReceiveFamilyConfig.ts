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

export function useReceiveFamilyConfig({
  getFamilyConfig,
  descriptor,
  asset,
  receive,
  accountStatus,
}: Params): ReceiveFamilyConfig {
  return useMemo(() => {
    if (!getFamilyConfig || !descriptor || !asset) return DEFAULT_RECEIVE_FAMILY_CONFIG;
    return {
      ...DEFAULT_RECEIVE_FAMILY_CONFIG,
      ...getFamilyConfig({ descriptor, asset, receive, accountStatus }),
    };
  }, [getFamilyConfig, descriptor, asset, receive, accountStatus]);
}
