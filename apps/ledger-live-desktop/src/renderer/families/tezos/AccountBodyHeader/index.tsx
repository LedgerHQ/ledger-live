import React, { useCallback } from "react";
import Delegation from "../Delegation";
import Box from "~/renderer/components/Box";
import Card from "~/renderer/components/Box/Card";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Text from "~/renderer/components/Text";
import styled from "styled-components";
import { Account } from "@ledgerhq/types-live";
import Label from "~/renderer/components/Label";
import Button from "~/renderer/components/ButtonV3";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
type Props = {
  account: Account;
  parentAccount: Account | null;
};
const Wrapper = styled(Box).attrs(() => ({
  p: 4,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
const TableContainer = styled(Card)`
  border-radius: 4px;
  overflow: hidden;
`;
const AccountBodyHeader = ({ account, parentAccount }: Props) => {
  const history = useHistory();
  const { t } = useTranslation();
  const onNFTClick = useCallback(() => {
    const pathname = `/platform/objkt`;
    history.push({
      pathname,
      state: {
        accountId: account.id,
      },
    });
  }, [history, account.id]);
  return (
    <>
      <FeatureToggle feature="objkt">
        <TableContainer mb={6}>
          <Wrapper horizontal>
            <Box
              style={{
                maxWidth: "65%",
              }}
            >
              <Text ff="Inter|Bold" color="palette.text.shade100" fontSize={4}>
                {t("tezos.objkt.card.title")}
              </Text>
              <Box mt={2}>
                <Label fontSize={4}>{t("tezos.objkt.card.description")}</Label>
              </Box>
            </Box>
            <Box>
              <Button variant="color" onClick={onNFTClick}>
                <Box horizontal flow={1} alignItems="center">
                  <Box>{t("tezos.objkt.card.cta")}</Box>
                </Box>
              </Button>
            </Box>
          </Wrapper>
        </TableContainer>
      </FeatureToggle>
      <Delegation account={account} parentAccount={parentAccount} />
    </>
  );
};
export default AccountBodyHeader;
