import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { setHasProtectedOrdinalsAssets } from "~/renderer/actions/settings";
import { hasProtectedOrdinalsAssetsSelector } from "~/renderer/reducers/settings";
import { Flex, Text } from "@ledgerhq/react-ui";
import Switch from "~/renderer/components/Switch";

export const ExcludeAssetsSection: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasProtectedOrdinals = useSelector(hasProtectedOrdinalsAssetsSelector);

  const onSwitchChange = useCallback(() => {
    dispatch(setHasProtectedOrdinalsAssets(!hasProtectedOrdinals));
  }, [dispatch, hasProtectedOrdinals]);

  return (
    <Flex alignItems="center">
      <Text variant="bodyLineHeight" color="neutral.c70" flex={1} fontSize={14}>
        {t("ordinals.coinControl.excludeAssets")}
      </Text>
      <Flex>
        <Switch
          data-testid="ordinals-protect-switch"
          isChecked={hasProtectedOrdinals}
          onChange={onSwitchChange}
        />
      </Flex>
    </Flex>
  );
};
