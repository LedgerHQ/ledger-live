import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { networkErrorSelector } from "../../reducers/appstate";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";

const Header = () => {
  const { error } = useGlobalSyncState();
  const networkError = useSelector(networkErrorSelector);
  return error ? (
    <View style={styles.root}>
      <HeaderErrorTitle withDescription error={networkError || error} />
    </View>
  ) : null;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export default memo<{}>(Header);
const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
  },
});
