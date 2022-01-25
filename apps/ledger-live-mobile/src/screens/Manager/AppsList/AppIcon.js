// @flow
import React, { memo, useMemo } from "react";
import { Image, View, StyleSheet } from "react-native";
import manager from "@ledgerhq/live-common/lib/manager";
import {
  findCryptoCurrencyById,
  getCurrencyColor,
} from "@ledgerhq/live-common/lib/currencies";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import ManagerAppIcon from "../../../images/managerAppIcon.png";

type Props = {
  app?: App,
  icon?: string,
  size: number,
};

function AppIcon({ size = 38, app, icon: defaultIcon = "" }: Props) {
  const { currencyId, icon } = app || {};

  const uri = useMemo(() => manager.getIconUrl(icon || defaultIcon), [
    icon,
    defaultIcon,
  ]);

  const currency = currencyId && findCryptoCurrencyById(currencyId);
  const currencyColor = currency && getCurrencyColor(currency);
  const IconComponent = currency ? getCryptoCurrencyIcon(currency) : null;

  return IconComponent ? (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: currencyColor,
        },
      ]}
    >
      <View style={styles.innerContainer}>
        <IconComponent size={size * 0.9} color="#FFFFFF" />
      </View>
    </View>
  ) : uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      defaultSource={ManagerAppIcon}
      fadeDuration={0}
    />
  ) : null;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    position: "relative",
  },
  innerContainer: {
    position: "absolute",
    top: "6%",
    left: "6%",
    width: "90%",
    height: "90%",
  },
});

export default memo<Props>(AppIcon);
