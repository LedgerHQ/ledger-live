// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import { Trans } from "react-i18next";
import colors from "../colors";

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

class UpgradeToNanoXBanner extends PureComponent<Props> {
  render() {
    const { action } = this.props;

    return (
      <View style={styles.wrapper}>
        <NanoXVertical style={styles.icon} size={56} />
        <View style={styles.textWrapper}>
          <LText style={styles.text}>
            <Trans i18nKey="onboarding.stepLegacy.bannerDescription" />
          </LText>

          <Touchable
            event="OnboardingLegacyBuy"
            onPress={action || null}
            style={styles.buyTouch}
            hitSlop={hitSlop}
          >
            <LText semiBold style={[styles.subText, styles.buy]}>
              <Trans i18nKey="onboarding.stepLegacy.buy" />
            </LText>
            <IconArrowRight size={16} color={colors.live} />
          </Touchable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    paddingLeft: 0,
    borderRadius: 4,
    backgroundColor: colors.lightGrey,
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
  buy: {
    color: colors.live,
  },
  buyTouch: {
    flexDirection: "row",
    alignItems: "center",
  },
  subText: {
    fontSize: 14,
    color: colors.grey,
  },
  text: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 21,
    marginBottom: 4,
  },
});

export default UpgradeToNanoXBanner;
