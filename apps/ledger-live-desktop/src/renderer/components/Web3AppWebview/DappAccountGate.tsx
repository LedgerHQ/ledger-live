import React from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { SetCurrentAccountHistDb } from "@ledgerhq/live-common/wallet-api/react";
import { NoAccountOverlay } from "./NoAccountOverlay";
import { WebviewLoader } from "./types";

type Props = {
  manifest: LiveAppManifest;
  isLoadingAccounts: boolean;
  currentAccountHistDbLoaded?: boolean;
  setCurrentAccountHistDb: SetCurrentAccountHistDb;
  Loader: WebviewLoader;
};

/**
 * Renders either a loading spinner or the no-account selection overlay
 * for dApps that require an account but none is available yet.
 * The parent is responsible for the early-return guard
 * (`isDapp && noAccounts && setCurrentAccountHistDb`).
 */
export function DappAccountGate({
  manifest,
  isLoadingAccounts,
  currentAccountHistDbLoaded,
  setCurrentAccountHistDb,
  Loader,
}: Props): React.JSX.Element {
  if (!currentAccountHistDbLoaded || isLoadingAccounts) {
    return <Loader manifest={manifest} isLoading={true} />;
  }

  return <NoAccountOverlay manifest={manifest} setCurrentAccountHistDb={setCurrentAccountHistDb} />;
}
