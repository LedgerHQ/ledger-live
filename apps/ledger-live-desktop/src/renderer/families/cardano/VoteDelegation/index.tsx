import React from "react";
import invariant from "invariant";
import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { openModal } from "~/renderer/actions/modals";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import IconChartLine from "~/renderer/icons/ChartLine";
import Header from "./Header";
import Row from "./Row";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";

import { AccountLike } from "@ledgerhq/types-live";

type Props = {
  account: AccountLike;
};

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

const VoteDelegation = ({ account }: Props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (account.type !== "Account") return null;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { cardanoResources } = account as CardanoAccount;
  invariant(cardanoResources, "cardano account expected");
  const delegation = cardanoResources.delegation;
  return (
    <TableContainer mb={6}>
      <TableHeader
        title={t("voteDelegation.header")}
        titleProps={{
          "data-e2e": "title_Delegation",
        }}
      />
      {delegation && delegation.dRepHex ? (
        <>
          <Header />
          <Row delegation={delegation} account={account as CardanoAccount} />
        </>
      ) : (
        <Wrapper horizontal>
          <Box
            style={{
              maxWidth: "65%",
            }}
          >
            <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
              {t("voteDelegation.delegateVotePower", {
                name: account.currency.name,
              })}
            </Text>
          </Box>
          <Box>
            <Button
              primary
              id={"account-vote-delegate-button"}
              onClick={() => {
                dispatch(
                  openModal("MODAL_CARDANO_VOTE_DELEGATION_INFO", {
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                    account: account as CardanoAccount,
                  }),
                );
              }}
            >
              <Box horizontal flow={1} alignItems="center">
                <IconChartLine size={12} />
                <Box>{t("voteDelegation.button")}</Box>
              </Box>
            </Button>
          </Box>
        </Wrapper>
      )}
    </TableContainer>
  );
};

export default VoteDelegation;
