import React from "react";
import { Button, Flex, Icon, Link, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import ErrorNoBorder from "~/renderer/icons/ErrorNoBorder";
import { openURL } from "~/renderer/linking";
import ExportLogsButton from "~/renderer/components/ExportLogsButton";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";

export const NetworkErrorScreen = ({ refresh }: { refresh: () => void }) => {
  const { t } = useTranslation();

  const urlContactSupportWebview = useLocalizedUrl(urls.contactSupportWebview);

  const handleContactSupport = () => openURL(urlContactSupportWebview);

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
      <Text
        variant="body"
        color="neutral.c70"
        marginTop="24px"
        width="343px"
        fontSize={14}
        fontFamily="Inter"
        textAlign="center"
      >
        {t("webview.networkError.subtitle")}
      </Text>
      <Button
        variant="main"
        width={143}
        height={40}
        marginTop="24px"
        onClick={refresh}
        borderRadius="44px"
      >
        {t("common.tryAgain")}
      </Button>
      <ExportLogsButton
        customComponent={(handleSaveLogPress: () => Promise<void>) => (
          <Link
            size="large"
            Icon={() => <Icon name="Import" />}
            marginTop="17px"
            onClick={handleSaveLogPress}
          >
            <Text fontSize={14} fontWeight="semiBold" fontFamily="Inter">
              {t("webview.networkError.saveLog")}
            </Text>
          </Link>
        )}
      />

      <Link
        size="large"
        Icon={() => <Icon name="ExternalLink" />}
        marginTop="17px"
        onClick={handleContactSupport}
      >
        <Text fontSize={14} fontWeight="semiBold" fontFamily="Inter">
          {t("webview.networkError.contactSupport")}
        </Text>
      </Link>
    </Flex>
  );
};
