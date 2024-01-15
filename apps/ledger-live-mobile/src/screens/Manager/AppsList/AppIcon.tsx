import React, { memo, useMemo } from "react";
import { Image } from "react-native";
import manager from "@ledgerhq/live-common/manager/index";
import { findCryptoCurrencyById, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";

import type { App } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import ManagerAppIcon from "~/images/managerAppIcon.png";

type Props = {
  app?: App;
  icon?: string;
  size: number;
  radius?: number;
};

const IconContainer = styled(Flex).attrs({
  position: "absolute",
  top: "6%",
  left: "6%",
  width: "90%",
  height: "90%",
})``;

function AppIcon({ size = 38, app, icon: defaultIcon = "", radius = 14 }: Props) {
  const { currencyId, icon } = app || {};

  const uri = useMemo(() => manager.getIconUrl(icon || defaultIcon), [icon, defaultIcon]);

  const currency = currencyId && findCryptoCurrencyById(currencyId);
  const currencyColor = (currency && getCurrencyColor(currency)) || undefined;
  const IconComponent = currency ? getCryptoCurrencyIcon(currency) : null;

  return IconComponent ? (
    <Flex
      position="relative"
      style={{
        width: size,
        height: size,
        backgroundColor: currencyColor,
        borderRadius: radius,
      }}
    >
      <IconContainer>
        <IconComponent size={size * 0.9} color="#FFFFFF" />
      </IconContainer>
    </Flex>
  ) : uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      defaultSource={ManagerAppIcon}
      fadeDuration={0}
    />
  ) : null;
}

export default memo<Props>(AppIcon);
