// @flow

import type { Account } from "@ledgerhq/live-common/types/index";
import { BigNumber } from "bignumber.js";
import moment from "moment";
import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Bar from "~/renderer/components/AssetDistribution/Bar";
import Text from "~/renderer/components/Text";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { TableLine } from "./Header";
import { rgba } from "~/renderer/styles/helpers";
import { setDrawer } from "~/renderer/drawers/Provider";
import VoteDetails from "./VoteDetails";

const Wrapper: ThemedComponent<*> = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;

const Column: ThemedComponent<{ clickable?: boolean }> = styled(TableLine).attrs(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "palette.text.shade100" : "palette.text.shade80",
  fontSize: 3,
}))`
  cursor: ${p => (p.clickable ? "pointer" : "cursor")};
  ${p =>
    p.clickable
      ? `
    &:hover {
      color: ${p.theme.colors.palette.primary.main};
    }
    `
      : ``}
`;

const Ellipsis: ThemedComponent<{}> = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type Props = {
  account: Account,
  vote: any,
  onManageAction: (validator: any, action: string) => void,
  onExternalLink: (address: string) => void,
};

const VoteRow: ThemedComponent<{}> = styled(Wrapper).attrs(() => ({
  horizontal: true,
  alignItems: "center",
}))`
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  opacity: ${p => (p.isOptimistic ? 0.5 : 1)};
  cursor: pointer;

  &:hover {
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }
`;

const handleClickVote = (vote: any) =>
  setDrawer(VoteDetails, {
    vote,
    onClose: () => {},
  });

export function Row({ account, vote, onManageAction, onExternalLink }: Props) {
  const { name, description, outcomes, blocksRemaining, timestamp } = vote;

  const onExternalLinkClick = () => onExternalLink(name);

  const totalUniqueWallets = outcomes.reduce(
    (acc, outcome) => acc.plus(outcome.uniqueWallets),
    new BigNumber(0),
  );

  const totalHntVoted = outcomes.reduce(
    (acc, outcome) => acc.plus(outcome.hntVoted),
    new BigNumber(0),
  );

  const voteOpen = useMemo(() => blocksRemaining > 0, [blocksRemaining]);

  const estTimeToDisplay = useMemo(() => {
    if (!voteOpen) {
      return <Trans i18nKey="helium.votes.votingClosed" />;
    }

    const deadlineDate = moment(timestamp).add(blocksRemaining, "minutes");
    const duration = moment.duration(deadlineDate.diff(new Date()));
    return `${duration.days()}D ${duration.hours()}H ${duration.minutes()}Mins`;
  }, [voteOpen, blocksRemaining, timestamp]);

  const votedForPercent = (outcomes[0].hntVoted / totalHntVoted) * 100;

  return (
    <VoteRow onClick={() => handleClickVote(vote)}>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Ellipsis>{name}</Ellipsis>
      </Column>
      <Column>
        <Ellipsis>{description}</Ellipsis>
      </Column>
      <Column>
        <Text marginRight={"11px"} ff="Inter" color="palette.text.shade100" fontSize={3}>
          {totalUniqueWallets.toString()}
        </Text>
        <Bar backgroundColor={"#484CF6"} progress={votedForPercent} progressColor={"#69DBB3"} />
      </Column>
      <Column>{estTimeToDisplay}</Column>
    </VoteRow>
  );
}
