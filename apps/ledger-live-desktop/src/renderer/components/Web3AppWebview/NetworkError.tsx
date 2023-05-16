import React, { useCallback } from "react";
import { Button, Flex, Icon, Link, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import ErrorNoBorder from "~/renderer/icons/ErrorNoBorder";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";

export const NetworkErrorScreen = ({ refresh }: { refresh: () => void }) => {
  const { t } = useTranslation();

  const handleContactSupport = useCallback(() => openURL(urls.contactSupportWebview), []);

  return (
    <Flex alignItems="center" justifyContent="center" flexGrow={1} flexDirection="column">
      <ErrorNoBorder size={64} />
      <Text
        variant="h4Inter"
        marginTop="16px"
        fontSize={24}
        fontWeight="semiBold"
        fontFamily="Inter"
      >
        {t("webview.networkError.title")}
      </Text>
      <Text variant="body" color="neutral.c70" marginTop="24px" fontSize={14} fontFamily="Inter">
        {t("webview.networkError.subtitle")}
      </Text>
      <Text variant="body" color="neutral.c70" marginTop="0px" fontSize={14} fontFamily="Inter">
        {t("webview.networkError.subtitleTwo")}
      </Text>
      <Button
        variant="main"
        width={143}
        height={40}
        marginTop="24px"
        onClick={refresh}
        borderRadius="44px"
      >
        {t("webview.networkError.tryAgain")}
      </Button>
      <Link
        size="large"
        Icon={() => <Icon name="ExternalLink" />}
        marginTop="17px"
        onClick={handleContactSupport}
      >
        <Text fontSize={14} fontWeight="bold" fontFamily="Inter">
          {t("webview.networkError.contactSupport")}
        </Text>
      </Link>
    </Flex>
  );
};
