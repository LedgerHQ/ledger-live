import React, { useCallback } from "react";
import { Flex, Icons, Text, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { setDrawer } from "~/renderer/drawers/Provider";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import CustomImage from "~/renderer/screens/customImage";

const CustomImageManagerButton: React.FC<Record<string, never>> = () => {
  const { t } = useTranslation();
  const handleClick = useCallback(() => {
    setDrawer(CustomImage);
  }, []);
  return (
    <Flex flexDirection="row" columnGap={3} alignItems="center">
      <Icons.ToolsMedium color="neutral.c80" size={16} />
      <Text color="neutral.c80" variant="bodyLineHeight" fontSize="14px">
        Custom image
      </Text>
      <Link
        type="color"
        onClick={handleClick}
        Icon={Icons.ChevronRightMedium}
        data-test-id="manager-custom-image-button"
      >
        {t("common.add")}
      </Link>
    </Flex>
  );
};

export default withV3StyleProvider(CustomImageManagerButton);
