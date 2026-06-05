import React from "react";
import { StyleSheet, View } from "react-native";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { SetCurrentAccountHistDb } from "@ledgerhq/live-common/wallet-api/react";
import { NoAccountScreen } from "./NoAccountScreen";

type Props = {
  manifest: LiveAppManifest;
  isLoadingAccounts: boolean;
  currentAccountHistDbLoaded?: boolean;
  setCurrentAccountHistDb: SetCurrentAccountHistDb;
  Loader: () => React.JSX.Element;
};

/**
 * Renders either a loading spinner or the no-account selection screen
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
    return (
      <View style={styles.root}>
        <Loader />
      </View>
    );
  }

  return <NoAccountScreen manifest={manifest} setCurrentAccountHistDb={setCurrentAccountHistDb} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
