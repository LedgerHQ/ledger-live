import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Icons, Flex } from "@ledgerhq/native-ui";

import Button from "./wrappedUi/Button";

const iconBuy = Icons.PlusMedium;
const iconReceive = Icons.ArrowBottomMedium;

function ReadOnlyFabActions() {
  const { t } = useTranslation();

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
      >
        {t("account.receive")}
      </Button>
    </Flex>
  );
}

export default memo(ReadOnlyFabActions);
