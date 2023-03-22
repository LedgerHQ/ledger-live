import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { useTheme } from "@react-navigation/native";
import styled from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";

import { ScreenName } from "../../../../const";

import FilteredSearchBar from "../../../../components/FilteredSearchBar";

import type { Node, NodeList } from "../types";

const StyledRectButton = styled(RectButton)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 30px 16px;
`;

type RouteParams = {
  nodeList: NodeList;
  onChange: (node: Node) => void;
};

type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};

function NodeListScreen({ navigation, route }: Props) {
  const {
    params: { nodeList, onChange },
  } = route;
  const { colors } = useTheme();

  const onNodePress = (node: Node) => {
    onChange(node);

    // navigate back to `StepStakingInfo` screen
    navigation.goBack();
  };

  const renderList = (items: NodeList) => (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      renderItem={({ item }) => (
        <StyledRectButton onPress={onNodePress.bind(null, item)}>
          <Text>{item.label}</Text>
        </StyledRectButton>
      )}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptySearch}>
      <Text style={styles.emptySearchText}>
        <Trans i18nKey="hedera.stake.flow.stake.nodeList.nodeNotFound" />
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.searchContainer}>
        <FilteredSearchBar
          inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
          list={nodeList}
          renderList={renderList}
          renderEmptySearch={renderEmptyList}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchContainer: {
    paddingTop: 16,
    flex: 1,
  },
  loadingContainer: {
    display: "flex",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingBottom: 32,
  },
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
  },
  emptySearch: {
    paddingHorizontal: 16,
  },
  emptySearchText: {
    marginTop: 10,
    textAlign: "center",
  },
});

export default NodeListScreen;