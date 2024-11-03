import { Flex, Icons } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import LearnMoreCta from "LLD/features/MemoTag/components/LearnMoreCta";
import { CircleWrapper } from "~/renderer/components/CryptoCurrencyIcon";
import Text from "~/renderer/components/Text";
import { urls } from "~/config/urls";

const MemoTagSendInfo = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Flex justifyContent="center" alignItems="center" width="100%">
      <Flex justifyContent="center" flexDirection="column" alignItems="center" width={343}>
        <CircleWrapper color={theme.colors.palette.opacityDefault.c05} size={72}>
          <Icons.InformationFill size="L" color="primary.c80" />
        </CircleWrapper>
        <Text fontSize={20} fontWeight={600} color="neutral.c100" mt={3}>
          {t("send.info.needMemoTag.title")}
        </Text>
        <Text fontSize={13} fontWeight={400} color="neutral.c80" mt={4} textAlign="center">
          {t("send.info.needMemoTag.description")}
        </Text>
        <LearnMoreCta
          color={theme.colors.wallet}
          style={{ fontSize: "13px", marginTop: 6 }}
          Icon={() => <Icons.ExternalLink size="S" />}
          url={urls.memoTag.learnMore}
        />
      </Flex>
    </Flex>
  );
};

export default MemoTagSendInfo;
