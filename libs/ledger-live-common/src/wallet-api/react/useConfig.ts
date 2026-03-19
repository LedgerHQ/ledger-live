import { useMemo } from "react";
import type { ServerConfig } from "@ledgerhq/wallet-api-server";

export function useConfig({
  appId,
  userId,
  tracking,
  wallet,
  mevProtected,
}: ServerConfig): ServerConfig {
  return useMemo(
    () => ({
      appId,
      userId,
      tracking,
      wallet,
      mevProtected,
    }),
    [appId, mevProtected, tracking, userId, wallet],
  );
}
