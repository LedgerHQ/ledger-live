import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Icons, Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";

import Button from "./wrappedUi/Button";

import { ScreenName } from "../const";
import useCurrency from "../helpers/useCurrency";
import { useCurrentRouteName } from "../helpers/routeHooks";
import { track } from "../analytics";

const iconBuy = Icons.PlusMedium;
const iconReceive = Icons.ArrowBottomMedium;

function ReadOnlyFabActions() {
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const currentRoute = useCurrentRouteName();
  const currency = useCurrency().name;

  const buyDevice = useCallback(() => navigate(ScreenName.BuyDeviceScreen), [
    navigate,
  ]);

  const handleOnPress = useCallback(
    (buttonTitle: string) => {
      track("button_clicked", {
        button: buttonTitle,
        screen: currentRoute,
        currency,
      });
      buyDevice();
    },
    [buyDevice, currency, currentRoute],
  );

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
        onPress={() => handleOnPress("+ Buy")}
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
        onPress={() => handleOnPress("Receive")}
      >
        {t("account.receive")}
      </Button>
    </Flex>
  );
}

export default memo(ReadOnlyFabActions);
