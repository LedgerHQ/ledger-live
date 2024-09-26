import React, { useCallback } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import Switch from "~/renderer/components/Switch";
import { hasProtectedOrdinalsAssetsSelector } from "~/renderer/reducers/settings";
import { setHasProtectedOrdinalsAssets } from "~/renderer/actions/settings";
import { useDispatch, useSelector } from "react-redux";
import { t } from "i18next";

const ProtectBox: React.FC = () => {
  const dispatch = useDispatch();
  const hasProtectedOrdinals = useSelector(hasProtectedOrdinalsAssetsSelector);

  const onSwitchChange = useCallback(() => {
    dispatch(setHasProtectedOrdinalsAssets(!hasProtectedOrdinals));
  }, [dispatch, hasProtectedOrdinals]);

  return (
    <Flex bg="opacityDefault.c10" borderRadius={12} padding={12} flexDirection="column" rowGap={10}>
      <Text variant="h4Inter" flex={1}>
        {t("ordinals.inscriptions.discoveryDrawer.protectTitle")}
      </Text>
      <Flex alignItems="center" columnGap={20}>
        <Text variant="bodyLineHeight" color="neutral.c70" flex={1} fontSize={14}>
          {t("ordinals.inscriptions.discoveryDrawer.protectDescription")}
        </Text>
        <Flex>
          <Switch isChecked={hasProtectedOrdinals} onChange={onSwitchChange} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ProtectBox;
