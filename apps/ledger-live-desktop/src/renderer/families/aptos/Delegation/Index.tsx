import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
//import { useAptosStakesWithMeta } from "@ledgerhq/live-common/families/aptos/react";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import Text from "~/renderer/components/Text";
import IconChartLine from "~/renderer/icons/ChartLine";
import DelegateIcon from "~/renderer/icons/Delegate";
import { openURL } from "~/renderer/linking";
import { Header } from "./Header";
import { Row } from "./Row";
import BigNumber from "bignumber.js";

//import { DelegateModalName } from "../modals";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
const Delegation = ({ account }: { account: AptosAccount }) => {
  // const { aptosResources } = account;
  const dispatch = useDispatch();
  const stakesWithMeta = generateFakeStakingPositions(5); //useAptosStakesWithMeta(account.currency, aptosResources.stakes);

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
  const hasStakes = stakesWithMeta.length > 0;

  return (
    <>
      {hasStakes ? (
        <TableContainer mb={6}>
          <TableHeader title={<Trans i18nKey="aptos.delegation.stakingPositionHeader" />}>
            <Button
              id={"account-delegate-button"}
              mr={2}
              color="palette.primary.main"
              small
              onClick={onDelegate}
            >
              <Box horizontal flow={1} alignItems="center">
                <DelegateIcon size={12} />
                <Box>
                  <Trans i18nKey="aptos.delegation.delegate" />
                </Box>
              </Box>
            </Button>
          </TableHeader>

          <Header />
          {stakesWithMeta.map(stakeWithMeta => (
            <Row
              stakingPosition={stakeWithMeta}
              key={stakeWithMeta.validator?.validatorAddress}
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
    <Wrapper horizontal>
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
          <Box horizontal flow={1} alignItems="center">
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

function generateFakeStakingPositions(count: number): AptosMappedStakingPosition[] {
  const positions: AptosMappedStakingPosition[] = [];

  for (let i = 0; i < count; i++) {
    const staked = new BigNumber((Math.random() * 1000).toFixed(2));
    const pending = new BigNumber((Math.random() * 500).toFixed(2));
    const available = new BigNumber((Math.random() * 200).toFixed(2));

    const validator: AptosValidatorItem = {
      validatorAddress: `0xV${i}`,
      commission: Math.floor(Math.random() * 100),
      tokens: (Math.random() * 1_000_000).toFixed(0),
    };

    positions.push({
      staked,
      available,
      pending,
      validatorId: validator.validatorAddress,
      formattedAmount: staked.toFormat(2),
      formattedPending: pending.toFormat(2),
      formattedAvailable: available.toFormat(2),
      rank: i + 1,
      validator,
    });
  }

  return positions;
}

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
