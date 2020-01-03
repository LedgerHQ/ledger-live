import React, { useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
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

const AppsList = ({
  apps,
  tab,
  active,
  renderNoResults,
  state,
  dispatch,
}: Props) => {
  const viewHeight = active ? "auto" : height - 267;
  const renderRow = useCallback(
    ({ item, index }: { item: App, index: number }) => (
      <AppRow
        app={item}
        index={index}
        state={state}
        dispatch={dispatch}
        tab={tab}
        animation
      />
    ),
    [tab, dispatch, state],
  );
  const keyExtractor = useCallback((d: App) => String(d.id) + tab, [tab]);

  if (apps.length <= 0)
    return (
      <View style={styles.renderNoResult}>
        {renderNoResults && renderNoResults()}
      </View>
    );

  return (
    <View style={{ height: viewHeight }}>
      <FlatList
        listKey={tab}
        data={apps}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
      />
    </View>
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
