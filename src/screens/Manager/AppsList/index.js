import React, { useCallback, memo } from "react";
import { View, StyleSheet, VirtualizedList } from "react-native";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { State } from "@ledgerhq/live-common/lib/apps";
import { useTheme } from "@react-navigation/native";
import AppRow from "./AppRow";
import getWindowDimensions from "../../../logic/getWindowDimensions";

type Props = {
  apps: Array<App>,
  isInstalledView: boolean,
  active: boolean,
  state: State,
  dispatch: *,
  renderNoResults?: (*) => Node,
  setAppInstallWithDependencies: ({ app: App, dependencies: App[] }) => void,
  setAppUninstallWithDependencies: ({ dependents: App[], app: App }) => void,
  setStorageWarning: () => void,
};

const { height } = getWindowDimensions();

const renderRow = ({ item }: { item: * }) => <AppRow {...item} />;

const AppsList = ({
  apps,
  active,
  renderNoResults,
  state,
  dispatch,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  setStorageWarning,
  isInstalledView,
}: Props) => {
  const viewHeight = active ? "auto" : height - 267;
  const { colors } = useTheme();

  const getItem = useCallback(
    (data, index) => ({
      app: data[index],
      index,
      state,
      dispatch,
      key: `${data[index].id}_${isInstalledView ? "Installed" : "Catalog"}`,
      visible: active,
      isInstalledView,
      setAppInstallWithDependencies,
      setAppUninstallWithDependencies,
      setStorageWarning,
    }),
    [
      state,
      dispatch,
      isInstalledView,
      active,
      setAppInstallWithDependencies,
      setAppUninstallWithDependencies,
      setStorageWarning,
    ],
  );

  if (!apps || apps.length <= 0)
    return (
      <View style={[styles.renderNoResult, { backgroundColor: colors.card }]}>
        {renderNoResults && renderNoResults()}
      </View>
    );

  return (
    <VirtualizedList
      style={{ height: viewHeight || 0 }}
      listKey={isInstalledView ? "Installed" : "Catalog"}
      data={apps}
      renderItem={renderRow}
      getItem={getItem}
      getItemCount={() => apps.length}
    />
  );
};

AppsList.defaultProps = {
  animation: true,
  renderNoResults: () => null,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  renderNoResult: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
  },
});

export default memo(AppsList);
