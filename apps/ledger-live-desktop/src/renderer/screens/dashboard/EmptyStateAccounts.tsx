import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import NoAccounts from "./NoAccountsImage";
import Text from "~/renderer/components/Text";
import LinkHelp from "~/renderer/components/LinkHelp";
import { openURL } from "~/renderer/linking";
import { DefaultTheme, withTheme } from "styled-components";
import FakeLink from "~/renderer/components/FakeLink";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
const EmptyStateAccounts = ({ theme }: { theme: DefaultTheme }) => {
  const { push } = useHistory();
  const { t } = useTranslation();

  const urlFaq = useLocalizedUrl(urls.faq);

  const handleInstallApp = useCallback(() => {
    push("/manager");
  }, [push]);
  const { openAssetFlow } = useOpenAssetFlow(
    ModularDrawerLocation.ADD_ACCOUNT,
    "emptyStateAccounts",
  );
  return (
    <Box
      alignItems="center"
      pb={8}
      style={{
        margin: "auto",
      }}
    >
      <NoAccounts size={250} />
      <Box mt={5} alignItems="center">
        <Text
          ff="Inter|SemiBold"
          color="palette.text.shade100"
          fontSize={5}
          data-testid="portfolio-empty-state-title"
        >
          {t("emptyState.accounts.title")}
        </Text>
        <Box mt={3}>
          <Text
            ff="Inter|Regular"
            color="palette.text.shade60"
            textAlign="center"
            fontSize={4}
            style={{
              maxWidth: 440,
            }}
          >
            {t("emptyState.accounts.desc")}
          </Text>
        </Box>
        <Box
          mt={5}
          mb={5}
          horizontal
          style={{
            width: 300,
          }}
          flow={3}
          justifyContent="center"
        >
          <Button
            primary
            onClick={openAssetFlow}
            data-testid="portfolio-empty-state-add-account-button"
          >
            {t("emptyState.accounts.buttons.addAccount")}
          </Button>
        </Box>
        <FakeLink
          underline
          fontSize={3}
          color="palette.text.shade80"
          onClick={handleInstallApp}
          data-e2e="accounts_empty_InstallApps"
        >
          {t("emptyState.accounts.buttons.installApp")}
        </FakeLink>
        <Box mt={5} justifyContent="center">
          <LinkHelp
            style={{
              color: theme.colors.palette.text.shade60,
            }}
            iconSize={14}
            label={<Trans i18nKey="emptyState.accounts.buttons.help" />}
            onClick={() => openURL(urlFaq)}
          />
        </Box>
      </Box>
    </Box>
  );
};
export default React.memo<{}>(withTheme(EmptyStateAccounts));
