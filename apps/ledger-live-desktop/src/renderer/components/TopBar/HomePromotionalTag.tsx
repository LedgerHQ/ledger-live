import React from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Icon, Flex, Tag } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

function HomePromotionalTag() {
  const { t } = useTranslation();
  const history = useHistory();
  const referralProgramConfig = useFeature("referralProgramDesktopBanner");

  return referralProgramConfig?.enabled && referralProgramConfig?.params?.path ? (
    <Tag
      type="opacity"
      active
      borderRadius={"50px"}
      style={{ cursor: "pointer" }}
      onClick={() =>
        history.push({
          pathname: referralProgramConfig?.params?.path,
          state: { source: "PortfolioHeader" },
        })
      }
    >
      <Flex justifyContent="center" flexDirection="row" height="100%" alignItems="center">
        <Icon name="GiftCard" size={13} color="primary.c80" />
        <Flex ml={4}>{t("banners.referralProgram.title")}</Flex>
      </Flex>
    </Tag>
  ) : null;
}

export default withV3StyleProvider(HomePromotionalTag);
