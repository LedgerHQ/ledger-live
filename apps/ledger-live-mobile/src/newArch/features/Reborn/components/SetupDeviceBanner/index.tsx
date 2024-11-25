import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import BuyDeviceBanner, { IMAGE_PROPS_POST_PURCHASHE } from "../BuyDeviceBanner";

type Props = {
  screen: string;
};

const SetupDeviceBanner = ({ screen }: Props) => {
  const { t } = useTranslation();

  return (
    <BuyDeviceBanner
      {...IMAGE_PROPS_POST_PURCHASHE}
      variant={"setup"}
      topLeft={
        <Text color="neutral.c00" mb={4} fontSize="14px" fontWeight="semiBold">
          {t("postBuyDeviceSetupNanoWall.bannerTitle")}
        </Text>
      }
      buttonLabel={t("postBuyDeviceSetupNanoWall.bannerCta")}
      buttonSize="small"
      event="button_clicked"
      screen={screen}
      image="setupYourLedger"
    />
  );
};

export default SetupDeviceBanner;
