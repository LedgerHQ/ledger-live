import React, { useCallback } from "react";
import { Flex, Icons, Text, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { setDrawer } from "~/renderer/drawers/Provider";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import CustomImage from "~/renderer/screens/customImage";
import RemoveCustomImage from "./RemoveCustomImage";
import UFO from "~/renderer/icons/UFO";
import { useSelector } from "react-redux";
import { lastSeenCustomImageSelector } from "~/renderer/reducers/settings";

const CustomImageManagerButton = () => {
  const { t } = useTranslation();
  const lastSeenCustomImage = useSelector(lastSeenCustomImageSelector);

  const onAdd = useCallback(() => {
    setDrawer(CustomImage);
  }, []);

  const onRemove = useCallback(() => {
    setDrawer(RemoveCustomImage);
  }, []);

  return (
    <Flex flexDirection="row" columnGap={3} alignItems="center">
      <UFO />
      <Text color="neutral.c80" variant="bodyLineHeight" fontSize={4}>
        {t("customImage.managerCTA")}
      </Text>
      <Link
        onClick={onAdd}
        Icon={Icons.ChevronRightMedium}
        data-test-id="manager-custom-image-button"
      >
        {t("common.add")}
      </Link>
      {lastSeenCustomImage.size ? (
        <Link
          onClick={onRemove}
          Icon={Icons.ChevronRightMedium}
          data-test-id="manager-custom-image-button"
        >
          {t("removeCustomLockscreen.cta")}
        </Link>
      ) : null}
    </Flex>
  );
};

export default withV3StyleProvider(CustomImageManagerButton);
