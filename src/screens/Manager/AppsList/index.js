import React, { Component } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  FlatList,
  Animated,
} from "react-native";
import { Trans } from "react-i18next";

import type { ApplicationVersion } from "@ledgerhq/live-common/lib/types/manager";
import { TouchableOpacity } from "react-native-gesture-handler";
import AppRow from "./AppRow";
import colors from "../../../colors";

type Props = {
  apps: Array<ApplicationVersion>,
  listKey: String,
  active: Boolean,
  state: *,
  dispatch: *,
  renderNoResults: Function,
};

const { height } = Dimensions.get("window");
class AppsList extends Component<Props> {
  keyExtractor = id => (d: ApplicationVersion) => String(d.id) + id;

  separator = () => <View style={styles.separator} />;

  renderRow = ({ item, index }) => (
    <AppRow
      app={item}
      index={index}
      state={this.props.state}
      dispatch={this.props.dispatch}
      listKey={this.props.listKey}
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
          //ItemSeparatorComponent={this.separator}
          renderItem={this.renderRow}
          keyExtractor={this.keyExtractor(listKey)}
        />
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  separator: {
    height: 1,
    width: "100%",
    backgroundColor: colors.lightFog,
    zIndex: 1,
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
