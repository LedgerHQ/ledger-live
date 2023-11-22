// @flow
import invariant from "invariant";
import styled from "styled-components";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import type { TFunction } from "react-i18next";
import {
  useIconPublicRepresentatives,
  useSortedSr,
  SR_MAX_VOTES,
} from "@ledgerhq/live-common/families/icon/react";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import type { Account } from "@ledgerhq/types-live";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Vote } from "@ledgerhq/live-common/families/tron/types";
import { localeSelector } from "~/renderer/reducers/settings";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import Trophy from "~/renderer/icons/Trophy";
import Medal from "~/renderer/icons/Medal";
import Text from "~/renderer/components/Text";
import ValidatorRow, { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import ValidatorListHeader from "~/renderer/components/Delegation/ValidatorListHeader";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import { colors } from "~/renderer/styles/theme";

const TECHIAST_ADDRESS = "hxdc4b3fb5b47d6c14c7f9a0bac8eea9f3f48d3288";

const VoteFieldStyled = styled.div`
  .icon-pr-row:first-child {
    border-color: ${colors.starYellow};
    :before {
      content: "";
      width: 4px;
      height: 100%;
      top: 0;
      left: 0;
      position: absolute;
      background-color: ${colors.starYellow};
    }
  }
`;
type Props = {
  t: TFunction;
  votes: Vote[];
  account: Account;
  status: TransactionStatus;
  onChangeVotes: (updater: any) => void;
  bridgePending: boolean;
};

const AmountField = ({ t, account, onChangeVotes, status, bridgePending, votes }: Props) => {
  invariant(account, "icon account required");

  const [search, setSearch] = useState("");
  const { iconResources } = account;

  invariant(iconResources && votes, "icon transaction required");

  const { votingPower, totalDelegated, votes: validators } = iconResources;

  const locale = useSelector(localeSelector);

  const publicRepresentatives = useIconPublicRepresentatives(account.currency);

  const SR = useSortedSr(search, publicRepresentatives, votes);
  const newSR = SR.slice();
  for (let i = 0; i < newSR.length; i++) {
    if (newSR[i].address === TECHIAST_ADDRESS) {
      const techiast = newSR.splice(i, 1);
      newSR.unshift(techiast[0]);
      break;
    }
  }

  const votesAvailable = votingPower.toNumber();
  const totalVotes = totalDelegated.toNumber() + votesAvailable;
  const votesUsed = votes.reduce((sum, v) => sum + Number(v.value), 0);
  const votesSelected = votes.length;
  const max = Math.max(0, totalVotes - votesUsed);

  const unit = getAccountUnit(account);

  const onUpdateVote = useCallback(
    (address, value) => {
      const raw = value ? parseInt(value.toString(), 10) : 0;
      const voteCount = raw <= 0 || votesSelected > SR_MAX_VOTES ? 0 : raw;
      onChangeVotes(existing => {
        const update = existing.filter(v => v.address !== address);
        let isRevote = false;
        voteCount == 0 &&
          (isRevote = validators.some(
            item => item.address == address && item.value > 0 && item.value != voteCount,
          ));
        // voting list remain only one item, and user want to revote it
        if (voteCount > 0 || isRevote) {
          update.push({ address, value: voteCount });
        }
        return update;
      });
    },
    [votesSelected, onChangeVotes, validators],
  );

  const containerRef = useRef();

  const explorerView = getDefaultExplorerView(account.currency);

  const onExternalLink = useCallback(
    (address: string) => {
      const srURL = explorerView && getAddressExplorer(explorerView, address);

      if (srURL) openURL(srURL);
    },
    [explorerView],
  );

  const onSearch = useCallback(evt => setSearch(evt.target.value), [setSearch]);

  const notEnoughVotes = votesUsed > totalVotes;
  const maxAvailable = Math.max(0, totalVotes - votesUsed);

  /** auto focus first input on mount */
  useEffect(() => {
    /** $FlowFixMe */
    if (containerRef && containerRef.current && containerRef.current.querySelector) {
      const firstInput = containerRef.current.querySelector("input");
      if (firstInput && firstInput.focus) firstInput.focus();
    }
  }, []);

  const renderItem = useCallback(
    ({ pr, rank, isSR }, i) => {
      const item = votes.find(v => v.address === pr.address);
      const disabled = !item && votesSelected >= SR_MAX_VOTES;
      return (
        <ValidatorRow
          key={`SR_${pr.address}_${i}`}
          validator={pr}
          icon={
            <IconContainer isSR={isSR}>
              {isSR ? <Trophy size={16} /> : <Medal size={16} />}
            </IconContainer>
          }
          title={
            <Text color={pr.address === TECHIAST_ADDRESS && colors.starYellow}>{`${rank}. ${
              pr.name || pr.address
            }`}</Text>
          }
          subtitle={
            <div style={{ display: "inline-grid" }}>
              <Trans
                i18nKey="vote.steps.castVotes.totalVotes"
                values={{ total: Math.round(pr.delegated.toNumber()).toLocaleString(locale) }}
              ></Trans>
              {pr.address === TECHIAST_ADDRESS && (
                <>
                  <br />
                  <Text>Support Techiast building this integration</Text>
                </>
              )}
            </div>
          }
          value={item && item.value}
          onUpdateVote={onUpdateVote}
          onExternalLink={onExternalLink}
          disabled={disabled}
          notEnoughVotes={notEnoughVotes}
          maxAvailable={maxAvailable}
          // dont allow for decimals
          unit={{ ...unit, magnitude: 0 }}
          shouldRenderMax={maxAvailable > 0 && !disabled}
          className="icon-pr-row"
        />
      );
    },
    [
      votes,
      locale,
      onUpdateVote,
      onExternalLink,
      notEnoughVotes,
      maxAvailable,
      votesSelected,
      unit,
    ],
  );

  if (!status) return null;
  return (
    <VoteFieldStyled>
      <ValidatorSearchInput search={search} onSearch={onSearch} />
      <ValidatorListHeader
        votesSelected={votesSelected}
        votesAvailable={votesAvailable}
        max={max}
        maxVotes={SR_MAX_VOTES}
        totalValidators={SR.length}
        notEnoughVotes={notEnoughVotes}
      />
      <Box ref={containerRef}>
        <ScrollLoadingList
          data={newSR}
          style={{ flex: "1 0 240px" }}
          renderItem={renderItem}
          noResultPlaceholder={SR.length <= 0 && search && <NoResultPlaceholder search={search} />}
        />
      </Box>
    </VoteFieldStyled>
  );
};

export default AmountField;
