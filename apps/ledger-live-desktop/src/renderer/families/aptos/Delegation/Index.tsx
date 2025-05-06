import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { AptosAccount, AptosStakeWithMeta } from "@ledgerhq/live-common/families/aptos/types";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import Text from "~/renderer/components/Text";
import IconChartLine from "~/renderer/icons/ChartLine";
import { openURL } from "~/renderer/linking";
import { Header } from "./Header";
import { Row } from "./Row";
import BigNumber from "bignumber.js";
import { useAptosStakesWithMeta } from "@ledgerhq/live-common/families/aptos/react"; // Replace with the correct hook
import { Box, Icons, Flex } from "@ledgerhq/react-ui";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
const Delegation = ({ account }: { account: AptosAccount }) => {
  const { aptosResources } = account;
  const dispatch = useDispatch();
  const onEarnRewards = useCallback(() => {
    dispatch(
      openModal("MODAL_APTOS_REWARDS_INFO", {
        account,
      }),
    );
  }, [account, dispatch]);
  const onDelegate = useCallback(() => {
    dispatch(
      openModal("MODAL_APTOS_DELEGATE", {
        account,
      }),
    );
  }, [account, dispatch]);
  const onRedirect = useCallback(() => {
    dispatch(
      openModal("MODAL_APTOS_DELEGATE", {
        account,
      }),
    );
  }, [account, dispatch]);

  const explorerView = getDefaultExplorerView(account.currency);
  const onExternalLink = useCallback(
    (address: string) => {
      if (address === "http://test.com") {
        openURL(urls.ledgerValidator);
      } else {
        const srURL = explorerView && getAddressExplorer(explorerView, address);
        if (srURL) openURL(srURL);
      }
    },
    [explorerView],
  );
  const stakesWithMeta = useAptosStakesWithMeta(account.currency, aptosResources?.stakes);

  const hasStakes = stakesWithMeta.length > 0;

  function convertToAptosMappedStakingPosition(
    stakeWithMeta: AptosStakeWithMeta,
  ): AptosMappedStakingPosition {
    console.log("convertToAptosMappedStakingPosition", stakeWithMeta);
    const { stake } = stakeWithMeta;
    const OCTA_UNIT = new BigNumber(10).pow(8);
    const staked = new BigNumber(stake.delegation?.stake || 0).dividedBy(OCTA_UNIT);
    const pending = new BigNumber(stake.reward?.amount || 0).dividedBy(OCTA_UNIT);
    const available = new BigNumber(stake.withdrawable || 0).dividedBy(OCTA_UNIT);

    return {
      staked,
      available,
      pending,
      validatorId: stake.delegation?.voteAccAddr || "",
      formattedAmount: staked.toFormat(2),
      formattedPending: pending.toFormat(2),
      formattedAvailable: available.toFormat(2),
      rank: 0,
      validator: {
        validatorAddress: stake.delegation?.voteAccAddr || "",
        commission: null,
        tokens: "",
      },
    };
  }

  return (
    <>
      {hasStakes ? (
        <TableContainer mb={6}>
          <TableHeader title={<Trans i18nKey="aptos.delegation.stakingPositionHeader" />}>
            <Button
              small
              primary
              id={"account-delegate-button"}
              mr={2}
              color="palette.primary.main"
              onClick={onDelegate}
            >
              <Flex alignItems={"center"}>
                <Icons.Plus size="XS" />
                <Trans i18nKey="aptos.delegation.delegate" />
              </Flex>
            </Button>
          </TableHeader>

          <Header />
          {stakesWithMeta.map((stakeWithMeta: AptosStakeWithMeta) => (
            <Row
              stakingPosition={convertToAptosMappedStakingPosition(stakeWithMeta)}
              key={stakeWithMeta.stake.stakeAccAddr}
              account={account}
              onManageAction={onRedirect}
              onExternalLink={onExternalLink}
            />
          ))}
        </TableContainer>
      ) : null}

      {!hasStakes && account.spendableBalance.gt(0) ? (
        <TableContainer mb={6}>
          <EarnRewardsCTA account={account} onEarnRewards={onEarnRewards} />
        </TableContainer>
      ) : null}
    </>
  );
};
type EarnRewardsCTAProps = {
  account: Account;
  onEarnRewards: () => void;
};
function EarnRewardsCTA({ account, onEarnRewards }: EarnRewardsCTAProps) {
  return (
    <Wrapper display="flex" flexDirection="row">
      <Box
        style={{
          maxWidth: "65%",
        }}
      >
        <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
          <Trans
            i18nKey="solana.delegation.emptyState.description"
            values={{
              name: account.currency.name,
            }}
          />
        </Text>
        <Box mt={2}>
          <LinkWithExternalIcon
            label={<Trans i18nKey="solana.delegation.emptyState.info" />}
            onClick={() => openURL(urls.solana.staking)}
          />
        </Box>
      </Box>
      <Box>
        <Button primary small onClick={onEarnRewards}>
          <Box display="flex" flexDirection="row" alignItems="center">
            <IconChartLine size={12} />
            <Box>
              <Trans i18nKey="solana.delegation.emptyState.delegation" />
            </Box>
          </Box>
        </Button>
      </Box>
    </Wrapper>
  );
}
const Delegations = ({ account }: { account: AptosAccount | TokenAccount }) => {
  if (account.type !== "Account") return null;
  return <Delegation account={account} />;
};
export default Delegations;

export type AptosMappedStakingPosition = AptosStakingPosition & {
  formattedAmount: string;
  formattedPending: string;
  formattedAvailable: string;
  rank: number;
  validator: AptosValidatorItem | null | undefined;
};

export type AptosStakingPosition = {
  staked: BigNumber;
  available: BigNumber;
  pending: BigNumber;
  validatorId: string;
};

export type AptosValidatorItem = {
  validatorAddress: string;
  commission: number | null;
  tokens: string;
};
