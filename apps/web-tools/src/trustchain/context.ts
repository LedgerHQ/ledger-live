import React, { useContext } from "react";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
// LKRP_MIGRATION: getSdk / TrustchainSDK → @features/platform-lkrp createLkrpSdk (inject crypto, keystore, HTTP backend, optional device).
// LKRP_MIGRATION: Trustchain / MemberCredentials → @shared/lkrp (opaque key handle; no walletSyncEncryptionKey).
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { getEnv } from "@shared/env";

export const defaultContext = {
  applicationId: 16,
  name: "WebTools",
  apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
};

export const TrustchainSDKContext = React.createContext<TrustchainSDK>(
  getSdk(false, defaultContext, withDevice),
);

export const useTrustchainSDK = () => useContext(TrustchainSDKContext);
