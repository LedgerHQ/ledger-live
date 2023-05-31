import React from "react";
import { Trans } from "react-i18next";
import {
  StyleSheet,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";

import FilteredSearchBar from "../../../../components/FilteredSearchBar";

import type { Node, NodeList } from "../types";

type Props = {
  nodeList: NodeList;
  onNodeSelect: (node: Node) => void;
  onBack: () => void;
};

function StakeToNodeSelect({ onNodeSelect, nodeList, onBack }: Props) {
  const { colors } = useTheme();

  const onNodePress = (node: Node) => {
    onNodeSelect(node);
  };

  const keyExtractor = (item: Node) => item.label;

  const renderItem = ({ item: result }: { item: Node }) => {
    const node = result;
    const description = node.description.replace("Hosted by ", "");
    return (
      <TouchableOpacity
        style={styles.contentContainer}
        onPress={() => onNodePress(node)}
        role="button"
      >
        <Text style={styles.firstLetterIcon}>{description.charAt(0)}</Text>
        <View style={styles.rowsContainer}>
          <View style={styles.row}>
            <Text numberOfLines={1} style={styles.description}>
              {description}
            </Text>
            <Text style={styles.staked}>
              {Math.round(node.stake / 100_000_000).toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{node.label}</Text>
            <Text style={node.rewarding ? styles.earning : styles.notEarning}>
              {node.rewarding ? "Earning rewards" : "Not earning rewards"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderList = (items: NodeList) => (
    <View style={styles.testFlex}>
      <View style={styles.topRow}>
        <Text>{"Nodes · Reward rate 6.5%"}</Text>
        <Text>{"Total staked / Status"}</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyExtractor={keyExtractor}
      />
    </View>
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
      <FilteredSearchBar
        inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
        list={nodeList}
        renderList={renderList}
        renderEmptySearch={renderEmptyList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  topRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#272727",
  },
  contentContainer: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 15,
    maxWidth: "100%",
    paddingHorizontal: 16,
  },
  firstLetterIcon: {
    textAlign: "center",
    padding: 5,
    backgroundColor: "#717070",
    borderRadius: 8,
    height: 32,
    width: 32,
    marginRight: 12,
  },
  rowsContainer: {
    flexGrow: 1,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    alignSelf: "stretch",
  },
  description: {
    lineHeight: 17,
    fontSize: 14,
    marginBottom: 2,
  },
  staked: {
    fontSize: 14,
    lineHeight: 17,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
    color: "#949494",
  },
  earning: {
    fontSize: 12,
    lineHeight: 15,
    color: "#5F9954",
  },
  notEarning: {
    fontSize: 12,
    lineHeight: 15,
    color: "#DD9323",
  },
  testFlex: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
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
    width: "100%",
  },
  emptySearch: {
    paddingHorizontal: 16,
  },
  emptySearchText: {
    marginTop: 10,
    textAlign: "center",
  },
});

export default StakeToNodeSelect;

// type Props = {
//   selected: number | null;
//   nodeList: NodeList;
//   onChange: (node: Node) => void;
//   navigation: StackNavigationProp<
//     HederaStakeFlowParamList,
//     ScreenName.HederaStakingStarted,
//     undefined
//   >;
// };

// function StakeToNodeSelect({
//   selected,
//   onChange,
//   nodeList,
//   navigation,
// }: Props) {
//   const { t } = useTranslation();

//   if (selected) {
//     // const selectedNode = nodeList.find((node: Node) => node.value === selected);
//     // selected = selectedNode?.value ?? null;
//   }

//   return (
//     <SettingsRow
//       style={styles.container}
//       event="HederaStakeNodeListSettingsRow"
//       title={t("hedera.common.node")}
//       arrowRight
//       compact
//       onPress={() =>
//         navigation.navigate(ScreenName.HederaStakeNodeList, {
//           nodeList,
//           onChange,
//         })
//       }
//     >
//       <Text variant={"body"} fontWeight={"medium"} color="primary.c80">
//         {selected}
//       </Text>
//     </SettingsRow>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     margin: -2,
//   },
// });

// export default StakeToNodeSelect;
