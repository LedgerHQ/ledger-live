// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { getDeviceModel } from "@ledgerhq/devices";

import { Trans } from "react-i18next";

import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import IconArrowRight from "../icons/ArrowRight";
import Touchable from "./Touchable";
import NanoXVertical from "../icons/NanoXVertical";

type Props = {
  action?: () => *,
};

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

function UpgradeToNanoXBanner({ action }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <NanoXVertical style={styles.icon} size={56} />
      <View style={styles.textWrapper}>
        <LText style={styles.text} color="grey">
          <Trans
            i18nKey="onboarding.stepLegacy.bannerDescription"
            values={getDeviceModel("nanoX")}
          />
        </LText>

        <Touchable
          event="OnboardingLegacyBuy"
          onPress={action || null}
          style={styles.buyTouch}
          hitSlop={hitSlop}
        >
          <LText semiBold style={[styles.subText]} color="live">
            <Trans
              i18nKey="onboarding.stepLegacy.buy"
              values={getDeviceModel("nanoX")}
            />
          </LText>
          <IconArrowRight size={16} color={colors.live} />
        </Touchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    paddingLeft: 0,
    borderRadius: 4,

    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 20,
    marginLeft: 16,
  },
  textWrapper: {
    flex: 1,
  },
  buyTouch: {
    flexDirection: "row",
    alignItems: "center",
  },
  subText: {
    fontSize: 14,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
  },
});

export default memo<Props>(UpgradeToNanoXBanner);
