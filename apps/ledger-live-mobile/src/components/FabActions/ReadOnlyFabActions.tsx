import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { IconsLegacy, Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";

import Button from "../wrappedUi/Button";

import { ScreenName } from "~/const";
import useCurrency from "~/helpers/useCurrency";
import { track } from "~/analytics";

const iconBuy = IconsLegacy.PlusMedium;
const iconReceive = IconsLegacy.ArrowBottomMedium;

function ReadOnlyFabActions() {
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const currency = useCurrency().name;

  const buyDevice = useCallback(() => navigate(ScreenName.NoDeviceWallScreen), [navigate]);

  const handleOnPress = useCallback(
    (buttonTitle: string) => {
      track("button_clicked", {
        button: buttonTitle,
        page: "Account",
        currency,
      });
      buyDevice();
    },
    [buyDevice, currency],
  );

  const pressBuy = useCallback(() => handleOnPress("+ Buy"), [handleOnPress]);
  const pressReceive = useCallback(() => handleOnPress("Receive"), [handleOnPress]);

  return (
    <Flex mx={16} flexDirection={"row"}>
      <Button
        size={"large"}
        Icon={iconBuy}
        iconPosition={"left"}
        type={"shade"}
        outline={true}
        key={"cta-buy"}
        mr={3}
        flex={1}
        onPress={pressBuy}
      >
        {t("account.buy")}
      </Button>
      <Button
        size={"large"}
        Icon={iconReceive}
        iconPosition={"left"}
        type={"shade"}
        outline={true}
        key={"cta-receive"}
        flex={1}
        onPress={pressReceive}
      >
        {t("account.receive")}
      </Button>
    </Flex>
  );
}

export default memo(ReadOnlyFabActions);
