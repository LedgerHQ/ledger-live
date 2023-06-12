import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

import BuyDeviceBanner, { IMAGE_PROPS_SMALL_NANO_BOX } from "./BuyDeviceBanner";

type Props = {
  screen: string;
};

function SetupDeviceBanner({ screen }: Props) {
  const { t } = useTranslation();

  return (
    <BuyDeviceBanner
      variant={"setup"}
      topLeft={
        <Text color="primary.c40" uppercase mb={3} fontSize="11px" fontWeight="semiBold">
          {t("postBuyDeviceSetupNanoWall.bannerTitle")}
        </Text>
      }
      style={{ paddingTop: 13.5, paddingBottom: 13.5 }}
      buttonLabel={t("postBuyDeviceSetupNanoWall.bannerCta")}
      buttonSize="small"
      event="button_clicked"
      screen={screen}
      {...IMAGE_PROPS_SMALL_NANO_BOX}
    />
  );
}

export default SetupDeviceBanner;
