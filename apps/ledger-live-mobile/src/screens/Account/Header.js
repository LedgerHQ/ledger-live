// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { useGlobalSyncState } from "@ledgerhq/live-common/lib/bridge/react";
import { networkErrorSelector } from "../../reducers/appstate";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";

type Props = {};

const Header = () => {
  const { error } = useGlobalSyncState();
  const networkError = useSelector(networkErrorSelector);
  return error ? (
    <View style={styles.root}>
      <HeaderErrorTitle withDescription error={networkError || error} />
    </View>
  ) : null;
};

export default React.memo<Props>(Header);

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
  },
});
