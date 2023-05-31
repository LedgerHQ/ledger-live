import React from "react";
import { StyleSheet, View } from "react-native";
import { Icons, Text } from "@ledgerhq/native-ui";

import { STAKE_METHOD } from "@ledgerhq/live-common/families/hedera/types";
import { Trans } from "react-i18next";
import { TouchableOpacity } from "react-native-gesture-handler";
import CheckBox from "../../../../components/CheckBox";

type Item = {
  label: string;
  key: string;
};

type Props = {
  items: Array<Item>;
  activeKey: string;
  selectNode: () => void;
  selectAccount: () => void;
};

const StakeMethodSelect = ({
  items,
  activeKey,
  selectNode,
  selectAccount,
}: Props) => {
  return (
    <View style={styles.methodSelect}>
      <View style={{ gap: 16 }}>
        <TouchableOpacity
          onPress={selectNode}
          role="button"
          style={
            activeKey === STAKE_METHOD.NODE
              ? styles.radioBoxActiveStyle
              : styles.radioBoxStyle
          }
        >
          <View
            style={[
              styles.iconBackgroundStyle,
              activeKey === STAKE_METHOD.NODE ? styles.iconActive : null,
            ]}
          >
            <Icons.CubeMedium
              color={activeKey === STAKE_METHOD.NODE ? "#BBB0FF" : "#FFFFFF"}
              size={16}
            />
          </View>
          <View style={styles.textContainer}>
            <Text
              color={activeKey === STAKE_METHOD.NODE ? "#D4CCFF" : "#FFFFFF"}
              fontSize={14}
              mb="2px"
              fontWeight="bold"
              style={styles.text}
            >
              <Trans i18nKey="hedera.stake.flow.stake.nodeTitle" />
            </Text>
            <Text
              color={activeKey === STAKE_METHOD.NODE ? "#BBB0FF" : "#949494"}
              fontSize={13}
              style={styles.text}
            >
              <Trans i18nKey="hedera.stake.flow.stake.nodeSubtitle" />
            </Text>
          </View>
          <View style={styles.checkbox}>
            <CheckBox
              isChecked={activeKey === STAKE_METHOD.NODE}
              onChange={selectNode}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={selectAccount}
          role="button"
          // style={styles.radioBoxActiveStyle}
          style={
            activeKey === STAKE_METHOD.ACCOUNT
              ? styles.radioBoxActiveStyle
              : styles.radioBoxStyle
          }
        >
          <View
            style={[
              styles.iconBackgroundStyle,
              activeKey === STAKE_METHOD.ACCOUNT ? styles.iconActive : null,
            ]}
          >
            <Icons.HandHoldingCoinMedium
              color={activeKey === STAKE_METHOD.ACCOUNT ? "#BBB0FF" : "#FFFFFF"}
              size={16}
            />
          </View>
          <View style={styles.textContainer}>
            <Text
              color={activeKey === STAKE_METHOD.ACCOUNT ? "#D4CCFF" : "#FFFFFF"}
              fontSize={14}
              mb="2px"
              fontWeight="bold"
              style={styles.text}
            >
              <Trans i18nKey="hedera.stake.flow.stake.accountTitle" />
            </Text>
            <Text
              color={activeKey === STAKE_METHOD.ACCOUNT ? "#BBB0FF" : "#949494"}
              fontSize={13}
              style={styles.text}
            >
              <Trans i18nKey="hedera.stake.flow.stake.accountSubtitle" />
            </Text>
          </View>
          <View style={styles.checkbox}>
            <CheckBox
              isChecked={activeKey === STAKE_METHOD.ACCOUNT}
              onChange={selectAccount}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  methodSelect: {
    paddingHorizontal: 16,
  },
  radioBoxStyle: {
    borderRadius: 8,
    padding: 16,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  radioBoxActiveStyle: {
    backgroundColor: "#2D2A3D",
    borderRadius: 8,
    padding: 16,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBackgroundStyle: {
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    height: 40,
    width: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconActive: {
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
  },
  textContainer: {
    flex: 1,
    flexWrap: "wrap",
  },
  text: {
    maxWidth: 215,
  },
  checkbox: {
    borderRadius: 50,
  },
});

export default StakeMethodSelect;
