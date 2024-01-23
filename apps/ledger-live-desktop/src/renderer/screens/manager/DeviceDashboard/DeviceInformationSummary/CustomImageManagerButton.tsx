import React, { useCallback } from "react";
import { Flex, IconsLegacy, Text, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { setDrawer } from "~/renderer/drawers/Provider";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import CustomImage from "~/renderer/screens/customImage";
import { useSelector } from "react-redux";
import { lastSeenCustomImageSelector } from "~/renderer/reducers/settings";
import ToolTip from "~/renderer/components/Tooltip";

type Props = {
  disabled?: boolean;
};

const CustomImageManagerButton = (props: Props) => {
  const { t } = useTranslation();
  const { disabled } = props;

  const lastSeenCustomImage = useSelector(lastSeenCustomImageSelector);

  const onAdd = useCallback(() => {
    setDrawer(CustomImage, {}, { forceDisableFocusTrap: true });
  }, []);

  return (
    <Flex flexDirection="row" columnGap={3} alignItems="center">
      <Text variant="h5Inter" fontSize={4} color="neutral.c70">
        {t("customImage.managerCTA")}
      </Text>
      <Link
        onClick={disabled ? undefined : onAdd}
        Icon={
          disabled
            ? props => (
                <ToolTip
                  content={
                    <Text color="neutral.c00" variant="small">
                      {t("appsInstallingDisabledTooltip")}
                    </Text>
                  }
                  placement="top"
                >
                  <IconsLegacy.InfoAltFillMedium {...props} />
                </ToolTip>
              )
            : IconsLegacy.ChevronRightMedium
        }
        disabled={disabled}
        data-test-id="manager-custom-image-button"
      >
        {lastSeenCustomImage.size ? t("changeCustomLockscreen.cta") : t("common.add")}
      </Link>
    </Flex>
  );
};

export default withV3StyleProvider(CustomImageManagerButton);
