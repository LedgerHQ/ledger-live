import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { TokenAccount } from "@ledgerhq/types-live";
import {
  useTronSuperRepresentatives,
  getLastVotedDate,
  formatVotes,
  getNextRewardDate,
} from "@ledgerhq/live-common/families/tron/react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { openURL } from "~/renderer/linking";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import IconChartLine from "~/renderer/icons/ChartLine";
import Vote from "~/renderer/icons/Vote";
import Header from "./Header";
import Row from "./Row";
import Footer from "./Footer";
import { BigNumber } from "bignumber.js";
import ToolTip from "~/renderer/components/Tooltip";
import ClaimRewards from "~/renderer/icons/ClaimReward";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { localeSelector } from "~/renderer/reducers/settings";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { useDateFromNow } from "~/renderer/hooks/useDateFormatter";
import { useHistory } from "react-router";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { track } from "~/renderer/analytics/segment";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
const Delegation = ({ account }: { account: TronAccount }) => {
  const history = useHistory();

  const locale = useSelector(localeSelector);
  const superRepresentatives = useTronSuperRepresentatives();
  const stakingUrl = useLocalizedUrl(urls.stakingTron);
  const lastVoteDate = getLastVotedDate(account);
  const duration = useMemo(() => {
    if (!lastVoteDate) return 0;
    const diff = new Date().getTime() - lastVoteDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [lastVoteDate]);
  const unit = useAccountUnit(account);
  const explorerView = getDefaultExplorerView(account.currency);
  const { tronResources } = account;
  const { votes, tronPower, unwithdrawnReward } = tronResources;

  const discreet = useDiscreetMode();
  const formattedUnwidthDrawnReward = formatCurrencyUnit(unit, BigNumber(unwithdrawnReward || 0), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  });
  const formattedVotes = formatVotes(votes, superRepresentatives);
  const totalVotesUsed = votes.reduce((sum, { voteCount }) => sum + voteCount, 0);
  const hasVotes = formattedVotes.length > 0;
  const hasRewards = unwithdrawnReward.gt(0);
  const nextRewardDate = getNextRewardDate(account);
  const nextRewardD = useMemo(
    () => (nextRewardDate ? new Date(nextRewardDate) : undefined),
    [nextRewardDate],
  );
  const formattedNextRewardDate = useDateFromNow(nextRewardD);

  const voteOnClick = () => {
    const value = "/platform/stakekit";

    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "manage votes",
      provider: "Stakekit",
      currency: "TRX",
    });
    history.push({
      pathname: value,
      state: {
        pendingaction: "REVOTE",
        yieldId: "tron-trx-native-staking",
        accountId: account.id,
        returnTo: `/account/${account.id}`,
      },
    });
  };

  const claimOnClick = () => {
    const value = "/platform/stakekit";
    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "claim rewards",
      provider: "Stakekit",
      currency: "TRX",
    });
    history.push({
      pathname: value,
      state: {
        pendingaction: "CLAIM_REWARDS",
        yieldId: "tron-trx-native-staking",
        accountId: account.id,
        returnTo: `/account/${account.id}`,
      },
    });
  };

  const canClaimRewards = hasRewards && !formattedNextRewardDate;
  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="tron.voting.header" />}
        titleProps={{
          "data-e2e": "title_Delegation",
        }}
      >
        {tronPower > 0 && formattedVotes.length > 0 ? (
          <Button small color="palette.primary.main" onClick={() => voteOnClick()} mr={2}>
            <Box horizontal flow={1} alignItems="center">
              <Vote size={12} />
              <Box>
                <Trans
                  i18nKey={
                    hasVotes ? "tron.voting.emptyState.voteExisting" : "tron.voting.emptyState.vote"
                  }
                />
              </Box>
            </Box>
          </Button>
        ) : null}
        {formattedVotes.length > 0 || canClaimRewards ? (
          <ToolTip
            content={
              !canClaimRewards ? (
                hasRewards && formattedNextRewardDate ? (
                  <Trans
                    i18nKey="tron.voting.nextRewardsDate"
                    values={{
                      date: formattedNextRewardDate,
                    }}
                  />
                ) : (
                  <Trans i18nKey="tron.voting.noRewards" />
                )
              ) : null
            }
          >
            <Button
              onClick={() => claimOnClick()}
              color="palette.primary.main"
              disabled={!hasRewards || !canClaimRewards}
              small
            >
              <Box horizontal flow={1} alignItems="center">
                <ClaimRewards size={12} />
                <Box>
                  <Trans
                    i18nKey={
                      hasRewards ? "tron.voting.claimAvailableRewards" : "tron.voting.claimRewards"
                    }
                    values={{
                      amount: formattedUnwidthDrawnReward,
                    }}
                  />
                </Box>
              </Box>
            </Button>
          </ToolTip>
        ) : null}
      </TableHeader>
      {tronPower > 0 && formattedVotes.length > 0 ? (
        <>
          <Header />
          {formattedVotes.map(({ validator, address, voteCount, isSR }, index) => (
            <Row
              key={index}
              validator={validator}
              address={address}
              amount={voteCount}
              isSR={isSR}
              duration={
                duration ? (
                  <Trans
                    i18nKey="delegation.durationDays"
                    count={duration}
                    values={{
                      count: duration,
                    }}
                  />
                ) : (
                  <Trans i18nKey="delegation.durationJustStarted" />
                )
              }
              percentTP={String(Math.round(100 * Number((voteCount * 1e2) / tronPower)) / 100)}
              explorerView={explorerView}
            />
          ))}
          <Footer total={tronPower} used={totalVotesUsed} onClick={() => undefined} />
        </>
      ) : (
        <Wrapper horizontal>
          <Box
            style={{
              maxWidth: "65%",
            }}
          >
            <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
              <Trans
                i18nKey={
                  tronPower > 0
                    ? "tron.voting.emptyState.votesDesc"
                    : "tron.voting.emptyState.description"
                }
                values={{
                  name: account.currency.name,
                }}
              />
            </Text>
            <Box mt={2}>
              <LinkWithExternalIcon
                label={<Trans i18nKey="tron.voting.emptyState.info" />}
                onClick={() => openURL(stakingUrl)}
              />
            </Box>
          </Box>
          <Box>
            <Button primary small disabled={true}>
              <Box horizontal flow={1} alignItems="center">
                <IconChartLine size={12} />
                <Box>
                  <Trans
                    i18nKey={tronPower > 0 ? "tron.voting.emptyState.vote" : "delegation.title"}
                  />
                </Box>
              </Box>
            </Button>
          </Box>
        </Wrapper>
      )}
    </TableContainer>
  );
};
const Votes = ({ account }: { account: TronAccount | TokenAccount }) => {
  if (account.type !== "Account") return null;
  return <Delegation account={account} />;
};
export default Votes;
