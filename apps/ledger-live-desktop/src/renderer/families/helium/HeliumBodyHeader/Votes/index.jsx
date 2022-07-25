// @flow

import { getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { useVotes } from "@ledgerhq/live-common/families/helium/react";
import type { Account } from "@ledgerhq/live-common/types/index";
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import Text from "~/renderer/components/Text";
import IconChartLine from "~/renderer/icons/ChartLine";
import VoteIcon from "~/renderer/icons/Vote";
import { openURL } from "~/renderer/linking";
import { Header } from "./Header";
import { Row } from "./Row";
import styled from "styled-components";

type Props = {
  account: Account,
};

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

type VoteCTAProps = {
  account: Account,
  onVote: () => void,
};

function VoteCTA({ account, onVote }: VoteCTAProps) {
  return (
    <Wrapper horizontal>
      <Box style={{ maxWidth: "65%" }}>
        <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
          <Trans
            i18nKey="helium.delegation.emptyState.description"
            values={{ name: account.currency.name }}
          />
        </Text>
        <Box mt={2}>
          <LinkWithExternalIcon
            label={<Trans i18nKey="helium.delegation.emptyState.info" />}
            onClick={() => openURL(urls.helium.staking)}
          />
        </Box>
      </Box>
      <Box>
        <Button primary small onClick={onVote}>
          <Box horizontal flow={1} alignItems="center">
            <IconChartLine size={12} />
            <Box>
              <Trans i18nKey="helium.delegation.emptyState.delegation" />
            </Box>
          </Box>
        </Button>
      </Box>
    </Wrapper>
  );
}

const Votes = ({ account }: Props) => {
  const { heliumResources } = account;
  invariant(heliumResources, "helium account and resources expected");

  const dispatch = useDispatch();

  // Sort in descending order by deadline
  const votes = useVotes().sort(function(a, b) {
    return b.deadline - a.deadline;
  });

  const onVote = useCallback(() => {
    dispatch(
      openModal("MODAL_HELIUM_VOTE", {
        account,
      }),
    );
  }, [account, dispatch]);

  const onRedirect = useCallback(
    (vote: any, modalName: string) => {
      dispatch(
        openModal(modalName, {
          account,
          vote,
        }),
      );
    },
    [account, dispatch],
  );

  const explorerView = getDefaultExplorerView(account.currency);

  const onExternalLink = useCallback(
    (vote: any) => {
      const url = "";

      if (url) {
        openURL(url);
      }
    },
    [explorerView],
  );

  return (
    <>
      {votes ? (
        <TableContainer mb={6}>
          <TableHeader title={<Trans i18nKey="helium.votes.listHeader" />}>
            <Button
              id={"account-vote-button"}
              mr={2}
              color="palette.primary.main"
              small
              onClick={onVote}
            >
              <Box horizontal flow={1} alignItems="center">
                <VoteIcon size={12} />
                <Box>
                  <Trans i18nKey="account.vote" />
                </Box>
              </Box>
            </Button>
          </TableHeader>

          <Header />
          {votes.map(vote => (
            <Row
              vote={vote}
              key={vote.id}
              account={account}
              onManageAction={onRedirect}
              onExternalLink={onExternalLink}
            />
          ))}
        </TableContainer>
      ) : null}

      {!votes && account.spendableBalance.gt(0) ? (
        <TableContainer mb={6}>
          <VoteCTA account={account} onVote={onVote} />
        </TableContainer>
      ) : null}
    </>
  );
};

export default Votes;
