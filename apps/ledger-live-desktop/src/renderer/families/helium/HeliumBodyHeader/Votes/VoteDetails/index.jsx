// @flow

import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import Bar from "~/renderer/components/AssetDistribution/Bar";
import DividerBar from "~/renderer/components/Bar";
import { BigNumber } from "bignumber.js";
import moment, { locale } from "moment";

export const Tag: ThemedComponent<{}> = styled(Box).attrs(() => ({
  horizontal: true,
  justifyContent: "center",
  ff: "Inter|SemiBold",
  fontSize: 4,
  backgroundColor: "palette.background.default",
  borderRadius: "4px",
  padding: "4px",
  width: "fit-content",
}))``;

export const Divider: ThemedComponent<{}> = styled(DividerBar).attrs(() => ({
  color: "palette.divider",
  size: 1,
}))``;

export const OpDetailsSection: ThemedComponent<{}> = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "flex-start",
  justifyContent: "space-between",
  ff: "Inter|SemiBold",
  fontSize: 4,
  color: "palette.text.shade60",
}))``;

export const OpDetailsTitle: ThemedComponent<{}> = styled(Box).attrs(p => ({
  ff: "Inter|SemiBold",
  fontSize: 3,
  color: "palette.text.shade100",
  horizontal: p.horizontal || true,
}))`
  justify-content: center;
  min-height: 30px;
  letter-spacing: 2px;
  line-height: 30px;
`;

export const OpDetailsData: ThemedComponent<{ color?: string }> = styled(Box).attrs(p => ({
  ff: "Inter",
  color: p.color || "palette.text.shade80",
  fontSize: 3,
  relative: true,
  flex: 1,
  horizontal: true,
  justifyContent: p.justifyContent || "flex-end",
  alignItems: p.alignItems || "center",
}))`
  min-height: 30px;
  max-width: 100%;
`;

type Props = {
  vote: any,
  onClose: () => void,
};

const VoteDetails = ({ vote, onClose }: Props) => {
  const { name, description, deadline, outcomes, blocksRemaining, timestamp } = vote;

  const totalUniqueWallets = outcomes.reduce(
    (acc, outcome) => acc.plus(outcome.uniqueWallets),
    new BigNumber(0),
  );

  const totalHntVoted = outcomes.reduce(
    (acc, outcome) => acc.plus(outcome.hntVoted),
    new BigNumber(0),
  );

  const voteOpen = useMemo(() => blocksRemaining && blocksRemaining > 0, [blocksRemaining]);

  const formattedTime = useMemo(() => {
    if (!voteOpen) {
      if (!timestamp) return;

      const endDate = new Date(timestamp);
      const formatted = moment(endDate).format("MM/DD/yy");
      return formatted;
    }

    const deadlineDate = moment(timestamp).add(blocksRemaining, "minutes");
    return moment(deadlineDate).format("MM/DD/yy");
  }, [timestamp, voteOpen, blocksRemaining]);

  const estTimeToDisplay = useMemo(() => {
    if (!voteOpen) {
      return <Trans i18nKey="helium.votes.votingClosed" />;
    }

    const deadlineDate = moment(timestamp).add(blocksRemaining, "minutes");
    const duration = moment.duration(deadlineDate.diff(new Date()));
    return `${duration.days()}D ${duration.hours()}H ${duration.minutes()}Mins`;
  }, [voteOpen, blocksRemaining, timestamp]);

  const votedForPercent = totalHntVoted > 0 ? (outcomes[0].hntVoted / totalHntVoted) * 100 : 0;
  const votedAgainstPercent = totalHntVoted > 0 ? (outcomes[1].hntVoted / totalHntVoted) * 100 : 0;

  return (
    <Box flow={3} px={20} mt={20}>
      <TrackPage
        category={"helium-vote-details"}
        name="Operation Details"
        currencyName={"helium"}
      />
      <Text
        ff="Inter|SemiBold"
        textAlign="center"
        fontSize={6}
        color="palette.text.shade80"
        mt={0}
        mb={1}
      >
        {name}
      </Text>
      <Box flow={1} justifyContent="center" horizontal alignItems="center" mt={1} mb={3}>
        {vote.tags.primary ? <Tag>{vote.tags.primary}</Tag> : null}
        {vote.tags.secondary ? <Tag>{vote.tags.secondary}</Tag> : null}
      </Box>
      <Text
        ff="Inter|SemiBold"
        textAlign="center"
        fontSize={4}
        color="palette.text.shade60"
        mt={0}
        mb={1}
      >
        {description}
      </Text>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey={"helium.votes.votingClosed"} />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box alignItems="flex-end">
            <Box horizontal alignItems="center">
              <Box ff="Inter|SemiBold" fontSize={4} mr={2}>
                {deadline.toLocaleString(locale)}
              </Box>
            </Box>
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey={"helium.votes.estTime"} />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box alignItems="flex-end">
            <Box horizontal alignItems="center">
              <Box ff="Inter|SemiBold" fontSize={4} mr={2}>
                {estTimeToDisplay}
              </Box>
            </Box>
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey={"helium.votes.totalVotes"} />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box alignItems="flex-end">
            <Box horizontal alignItems="center">
              <Box ff="Inter|SemiBold" fontSize={4} mr={2}>
                {`${totalUniqueWallets}`}
              </Box>
            </Box>
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <Divider></Divider>
      <OpDetailsSection>
        <OpDetailsTitle>{`${vote.outcomes[0].value} (${BigNumber(votedForPercent)
          .decimalPlaces(2)
          .toString()}%)`}</OpDetailsTitle>
      </OpDetailsSection>
      <Bar progress={votedForPercent} progressColor={"#69DBB3"} />
      <OpDetailsSection>
        <Text
          ff="Inter|SemiBold"
          textAlign="center"
          fontSize={4}
          color="palette.text.shade40"
          mt={0}
          mb={1}
        >
          {`${vote.outcomes[0].hntVoted} HNT`}
        </Text>
        <Box alignItems="flex-end">
          <Text
            ff="Inter|SemiBold"
            textAlign="center"
            fontSize={4}
            color="palette.text.shade40"
            mt={0}
            mb={1}
          >
            {`${vote.outcomes[0].uniqueWallets} Votes`}
          </Text>
        </Box>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>{`${vote.outcomes[1].value} (${BigNumber(votedAgainstPercent)
          .decimalPlaces(2)
          .toString()}%)`}</OpDetailsTitle>{" "}
      </OpDetailsSection>
      <Bar progress={votedAgainstPercent} progressColor={"#484CF6"} />
      <OpDetailsSection>
        <Text
          ff="Inter|SemiBold"
          textAlign="center"
          fontSize={4}
          color="palette.text.shade40"
          mt={0}
          mb={1}
        >
          {`${vote.outcomes[1].hntVoted} HNT`}
        </Text>
        <Box alignItems="flex-end">
          <Text
            ff="Inter|SemiBold"
            textAlign="center"
            fontSize={4}
            color="palette.text.shade40"
            mt={0}
            mb={1}
          >
            {`${vote.outcomes[1].uniqueWallets} Votes`}
          </Text>
        </Box>
      </OpDetailsSection>
    </Box>
  );
};

export default VoteDetails;
