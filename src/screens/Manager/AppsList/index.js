import React, { PureComponent } from "react";
import { View, StyleSheet, Dimensions, FlatList, Animated } from "react-native";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { State } from "@ledgerhq/live-common/lib/apps";
import AppRow from "./AppRow";
import colors from "../../../colors";

type Props = {
  apps: Array<App>,
  listKey: String,
  active: Boolean,
  state: State,
  dispatch: *,
  renderNoResults: Function,
};

const { height } = Dimensions.get("window");
class AppsList extends PureComponent<Props> {

  renderRow = ({ item, index }: { item: App, index: number }) => (
    <AppRow
      app={item}
      index={index}
      state={this.props.state}
      dispatch={this.props.dispatch}
      listView={this.props.listKey}
    />
  );

  render() {
    const { apps, listKey, active, renderNoResults } = this.props;

    if (apps.length <= 0)
      return (
        renderNoResults && (
          <View style={styles.renderNoResult}>{renderNoResults()}</View>
        )
      );

    const viewHeight = active ? "auto" : height - 203;

    return (
      <Animated.View style={{ height: viewHeight }}>
        <FlatList
          listKey={listKey}
          data={apps}
          renderItem={this.renderRow}
          keyExtractor={(d: App) => String(d.id) + listKey}
        />
      </Animated.View>
    );
  }
}

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
