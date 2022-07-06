import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Icons, Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";

import Button from "./wrappedUi/Button";

import { ScreenName } from "../const";

const iconBuy = Icons.PlusMedium;
const iconReceive = Icons.ArrowBottomMedium;

function ReadOnlyFabActions() {
  const { t } = useTranslation();
  const { navigate } = useNavigation();

  const handleOnPress = useCallback(() => {
    navigate(ScreenName.NoDeviceWallScreen);
  }, [navigate]);

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
        onPress={handleOnPress}
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
        onPress={handleOnPress}
      >
        {t("account.receive")}
      </Button>
    </Flex>
  );
}

export default memo(ReadOnlyFabActions);
