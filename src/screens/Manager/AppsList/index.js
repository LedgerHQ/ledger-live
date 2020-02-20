import React, { useCallback, useState, memo } from "react";
import { View, StyleSheet, VirtualizedList } from "react-native";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { State } from "@ledgerhq/live-common/lib/apps";
import AppRow from "./AppRow";
import colors from "../../../colors";
import getWindowDimensions from "../../../logic/getWindowDimensions";

type Props = {
  apps: Array<App>,
  isInstalledView: boolean,
  active: boolean,
  state: State,
  dispatch: *,
  renderNoResults?: (*) => Node,
  currentProgress: number,
  setAppInstallWithDependencies: ({ app: App, dependencies: App[] }) => void,
  setAppUninstallWithDependencies: ({ dependents: App[], app: App }) => void,
  setStorageWarning: () => void,
};

const { height } = getWindowDimensions();

const viewabilityConfig = {
  minimumViewTime: 0,
  viewAreaCoveragePercentThreshold: 0,
};

const renderRow = ({ item }: { item: * }) => {
  return <AppRow {...item} />;
};

const AppsList = ({
  apps,
  active,
  renderNoResults,
  state,
  dispatch,
  currentProgress,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  setStorageWarning,
  isInstalledView,
}: Props) => {
  const [viewableBounds, setViewableBounds] = useState([]);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      setViewableBounds(viewableItems.map(({ index }) => index));
    },
    [setViewableBounds],
  );
  const viewHeight = active ? "auto" : height - 267;

  const getItem = useCallback(
    (data, index) => ({
      app: data[index],
      index,
      state,
      dispatch,
      key: `${data[index].id}_${isInstalledView ? "Installed" : "Catalog"}`,
      visible: active && viewableBounds.includes(index),
      isInstalledView,
      currentProgress:
        (currentProgress &&
          currentProgress.appOp.name === data[index].name &&
          currentProgress.progress) ||
        0,
      setAppInstallWithDependencies,
      setAppUninstallWithDependencies,
      setStorageWarning,
    }),
    [
      state,
      dispatch,
      isInstalledView,
      active,
      viewableBounds,
      currentProgress,
      setAppInstallWithDependencies,
      setAppUninstallWithDependencies,
      setStorageWarning,
    ],
  );

  if (apps.length <= 0)
    return (
      <View style={styles.renderNoResult}>
        {renderNoResults && renderNoResults()}
      </View>
    );

  return (
    <VirtualizedList
      style={{ height: viewHeight }}
      listKey={isInstalledView ? "Installed" : "Catalog"}
      data={apps}
      renderItem={renderRow}
      getItem={getItem}
      initialNumToRender={10}
      getItemCount={() => apps.length}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
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
    backgroundColor: colors.white,
  },
});

export default memo(AppsList);
