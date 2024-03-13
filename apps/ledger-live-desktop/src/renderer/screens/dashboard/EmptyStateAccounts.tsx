import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import NoAccounts from "./NoAccountsImage";
import Text from "~/renderer/components/Text";
import LinkHelp from "~/renderer/components/LinkHelp";
import { openURL } from "~/renderer/linking";
import styled, { DefaultTheme, withTheme } from "styled-components";
import FakeLink from "~/renderer/components/FakeLink";
import { openModal } from "~/renderer/actions/modals";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import EntryButton from "~/renderer/components/EntryButton/EntryButton";
import { Flex, Grid, Icons } from "@ledgerhq/react-ui";

const FlexWrapper = styled(Flex)`
  position: relative;
  white-space: normal;
  flex-direction: row;
  height: 100%;
  gap: 20px;
  max-height: 120px;
`;

const ButtonGrid = styled(Grid).attrs(() => ({
  columns: 2,
  columnGap: 4,
  rowGap: 4,
}))`
  padding-top: ${p => p.theme.space[4]}px;
  padding-left: ${p => p.theme.space[4]}px;
  padding-right: ${p => p.theme.space[4]}px;
  padding-bottom: ${p => p.theme.space[6]}px;
  background-color: ${p => p.theme.colors.palette.background.default};
  border-radius: 8px;
  min-height: 120px;
  max-height: 120px;
  overflow-y: hidden;
`;

const EmptyStateAccounts = ({ theme }: { theme: DefaultTheme }) => {
  const { push } = useHistory();
  const { t } = useTranslation();

  const urlFaq = useLocalizedUrl(urls.faq);

  const handleInstallApp = useCallback(() => {
    push("/manager");
  }, [push]);
  const dispatch = useDispatch();
  const openAddAccounts = useCallback(() => {
    dispatch(openModal("MODAL_ADD_ACCOUNTS", undefined));
  }, [dispatch]);

  const handleAuthenticateSmartAccount = useCallback(() => {
    dispatch(openModal("MODAL_AUTHENTICATE_SMART_ACCOUNT", undefined));
  }, [dispatch]);
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
          data-test-id="portfolio-empty-state-title"
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
          <ButtonGrid>
            <EntryButton
              Icon={() => <Icons.Devices />}
              title={"Connect your ledger"}
              body={"Setup or connect your ledger"}
              onClick={handleAuthenticateSmartAccount}
              entryButtonTestId="entry-button"
            />
            <EntryButton
              Icon={() => <Icons.WalletInput />}
              title={"Smart account"}
              body={"Create your smart account"}
              label={"New"}
              onClick={handleAuthenticateSmartAccount}
              entryButtonTestId="entry-button"
            />
          </ButtonGrid>
        </Box>
      </Box>
    </Box>
  );
};
export default React.memo<{}>(withTheme(EmptyStateAccounts));
