import React, { useCallback, useState } from "react";
import { View, StyleSheet, VirtualizedList } from "react-native";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { State } from "@ledgerhq/live-common/lib/apps";
import AppRow from "./AppRow";
import colors from "../../../colors";
import getWindowDimensions from "../../../logic/getWindowDimensions";

type Props = {
  apps: Array<App>,
  tab: string,
  active: boolean,
  state: State,
  dispatch: *,
  renderNoResults?: (*) => Node,
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
  tab,
  active,
  renderNoResults,
  state,
  dispatch,
}: Props) => {
  const [viewableBounds, setViewableBounds] = useState({ min: 0, max: 10 });
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      const indexes = viewableItems.map(({ index }) => index);
      setViewableBounds({
        min: Math.max(0, indexes[0] - 5),
        max: indexes[indexes.length - 1] + 5,
      });
    },
    [setViewableBounds],
  );
  const viewHeight = active ? "auto" : height - 267;

  if (apps.length <= 0)
    return (
      <View style={styles.renderNoResult}>
        {renderNoResults && renderNoResults()}
      </View>
    );

  return (
    <VirtualizedList
      style={{ height: viewHeight }}
      listKey={tab}
      data={apps}
      renderItem={renderRow}
      getItem={(data, index) => ({
        app: data[index],
        index,
        state,
        dispatch,
        key: String(data[index].id) + tab,
        visible:
          active && index >= viewableBounds.min && index <= viewableBounds.max,
        tab,
      })}
      initialNumToRender={10}
      maxToRenderPerBatch={15}
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

export default AppsList;
