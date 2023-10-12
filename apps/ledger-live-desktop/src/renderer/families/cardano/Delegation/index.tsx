import React from "react";
import invariant from "invariant";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import IconChartLine from "~/renderer/icons/ChartLine";
import Header from "./Header";
import Row from "./Row";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import { AccountLike } from "@ledgerhq/types-live";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";

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

const Delegation = ({ account }: Props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (account.type !== "Account") return null;
  const { cardanoResources } = account as CardanoAccount;
  invariant(cardanoResources, "cardano account expected");
  const delegation = cardanoResources.delegation;
  return (
    <TableContainer mb={6}>
      <TableHeader
        title={t("delegation.header")}
        titleProps={{
          "data-e2e": "title_Delegation",
        }}
      />
      {delegation && delegation.poolId ? (
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
              {t("delegation.delegationEarn", {
                name: account.currency.name,
              })}
            </Text>
            <Box mt={2}>
              <LinkWithExternalIcon
                label={t("delegation.howItWorks")}
                onClick={() => openURL(urls.cardanoStakingRewards)}
              />
            </Box>
          </Box>
          <Box>
            <Button
              primary
              id={"account-delegate-button"}
              onClick={() => {
                dispatch(
                  openModal("MODAL_CARDANO_REWARDS_INFO", {
                    account: account as CardanoAccount,
                  }),
                );
              }}
            >
              <Box horizontal flow={1} alignItems="center">
                <IconChartLine size={12} />
                <Box>{t("delegation.title")}</Box>
              </Box>
            </Button>
          </Box>
        </Wrapper>
      )}
    </TableContainer>
  );
};

export default Delegation;
