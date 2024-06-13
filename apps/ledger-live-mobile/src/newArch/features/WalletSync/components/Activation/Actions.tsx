import React from "react";
import { Flex, Button, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

const Actions = () => {
  const { t } = useTranslation();

  const onPressSync = () => {
    // TODO
  };

  const onPressHasAlreadyAKey = () => {
    // TODO
  };

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={32}>
      <Button
        type="main"
        alignSelf={"stretch"}
        minWidth={"100%"}
        size="large"
        onPress={onPressSync}
      >
        {t("walletSync.activation.drawerAndSettings.mainCta")}
      </Button>
      <Link size="large" onPress={onPressHasAlreadyAKey}>
        {t("walletSync.activation.drawerAndSettings.secondCta")}
      </Link>
    </Flex>
  );
};
export default Actions;
