import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import Box from "~/renderer/components/Box";
import NoAccounts from "./NoAccountsImage";
import Text from "~/renderer/components/Text";
import styled, { DefaultTheme, withTheme } from "styled-components";
import { openModal } from "~/renderer/actions/modals";
import EntryButton from "~/renderer/components/EntryButton/EntryButton";
import { Grid, Icons } from "@ledgerhq/react-ui";
import { authenticate } from "@ledgerhq/account-abstraction/index";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";

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
  overflow-y: hidden;
`;

const EmptyStateAccounts = ({ theme }: { theme: DefaultTheme }) => {
  const { pushToast, dismissToast } = useToasts();

  const [emails, setEmails] = useState([
    // "samy.rabah-montarou@ledger.com",
    // "rabah.m.samy@gmail.com",
  ]);

  useEffect(() => {
    const AAEmails = localStorage.getItem("AA-emails");
    if (!!AAEmails) {
      const emailsFromLocalStorage = JSON.parse(AAEmails);
      setEmails(emailsFromLocalStorage);
    }

    console.log({ AAEmails });
  }, []);

  const dispatch = useDispatch();
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
      <NoAccounts size={200} />
      <Box mt={5} alignItems="center">
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
            Start using Ledger Live now, without any hardware wallet
          </Text>
        </Box>
        <Box
          mt={5}
          mb={5}
          horizontal
          style={{
            width: 500,
          }}
          flow={5}
          justifyContent="center"
        >
          <ButtonGrid>
            <EntryButton
              Icon={() => <Icons.WalletInput />}
              title={"Smart account"}
              body={"Create your smart account"}
              label={"New"}
              onClick={() => {
                handleAuthenticateSmartAccount();
              }}
              entryButtonTestId="entry-button"
            />
            {emails.map(email => {
              return (
                <EntryButton
                  Icon={() => <Icons.Mail />}
                  title={"Send connection link"}
                  key={email}
                  body={`${email}`}
                  onClick={() => {
                    authenticate(email);
                    pushToast({
                      id: `AA-${email}`,
                      title: "Connection email sent",
                      text: "Check it in your mail inbox.",
                      icon: "info",
                    });
                  }}
                  entryButtonTestId="entry-button"
                />
              );
            })}
          </ButtonGrid>
        </Box>
      </Box>
    </Box>
  );
};
export default React.memo<{}>(withTheme(EmptyStateAccounts));
