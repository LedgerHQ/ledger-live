import React from "react";
import { useTranslation } from "react-i18next";
// import { useNavigation } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";

import { StackNavigationProp } from "@react-navigation/stack";
import { ScreenName } from "../../../../const";
import SettingsRow from "../../../../components/SettingsRow";

import type { HederaStakeFlowParamList, Node, NodeList } from "../types";

type Props = {
  selected: number | null;
  nodeList: NodeList;
  onChange: (node: Node) => void;
  navigation: StackNavigationProp<
    HederaStakeFlowParamList,
    ScreenName.HederaStakeInfo,
    undefined
  >;
};

function StakeToNodeSelect({
  selected,
  onChange,
  nodeList,
  navigation,
}: Props) {
  const { t } = useTranslation();

  if (selected) {
    // const selectedNode = nodeList.find((node: Node) => node.value === selected);
    // selected = selectedNode?.value ?? null;
  }

  return (
    <SettingsRow
      style={styles.container}
      event="HederaStakeNodeListSettingsRow"
      title={t("hedera.common.node")}
      arrowRight
      compact
      onPress={() =>
        navigation.navigate(ScreenName.HederaStakeNodeList, {
          nodeList,
          onChange,
        })
      }
    >
      <Text variant={"body"} fontWeight={"medium"} color="primary.c80">
        {selected}
      </Text>
    </SettingsRow>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: -2,
  },
});

export default StakeToNodeSelect;
