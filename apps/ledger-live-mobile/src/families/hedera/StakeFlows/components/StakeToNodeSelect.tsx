import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";

import { ScreenName } from "../../../../const";
import SettingsRow from "../../../../components/SettingsRow";

import type { Node, NodeList } from "../types";

type Props = {
  selected: number | null;
  nodeList: NodeList;
  onChange: (node: Node) => void;
};

function StakeToNodeSelect({ selected, onChange, nodeList }: Props) {
  const { t } = useTranslation();
  const { navigate } = useNavigation();

  if (selected) {
    const selectedNode = nodeList.find((node: Node) => node.value === selected);
    selected = selectedNode?.value ?? null;
  }

  return (
    <SettingsRow
      style={styles.container}
      event="HederaStakeNodeListSettingsRow"
      title={t("hedera.common.node")}
      arrowRight
      compact
      onPress={() =>
        navigate(ScreenName.HederaStakeNodeList, { nodeList, onChange })
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