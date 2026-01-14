import React, { memo, useMemo } from "react";
import { Image } from "react-native";
import manager from "@ledgerhq/live-common/manager/index";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getValidCryptoIconSizeNative } from "@ledgerhq/live-common/helpers/cryptoIconSize";
import type { App } from "@ledgerhq/types-live";
import ManagerAppIcon from "~/images/managerAppIcon.webp";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";

type Props = {
  app?: App;
  icon?: string;
  size: number;
};

function AppIcon({ size = 38, app, icon: defaultIcon = "" }: Readonly<Props>) {
  const { currencyId, icon } = app || {};

  const uri = useMemo(() => manager.getIconUrl(icon || defaultIcon), [icon, defaultIcon]);

  const currency = currencyId && findCryptoCurrencyById(currencyId);

  // Use new CryptoIcon if currency exists
  if (currency) {
    const ledgerId = currency.id;
    const ticker = currency.ticker;
    const validSize = getValidCryptoIconSizeNative(size);

    return <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={validSize} overridesRadius={12} />;
  }

  // Fallback to manager icon for non-crypto apps
  return uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      defaultSource={ManagerAppIcon}
      fadeDuration={0}
    />
  ) : null;
}

export default memo<Props>(AppIcon);
