import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { useAptosMappedStakingPositions } from "@ledgerhq/live-common/families/aptos/react";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import IconChartLine from "~/renderer/icons/ChartLine";
import { Header } from "./Header";
import { Row } from "./Row";
import { canStake } from "@ledgerhq/live-common/families/aptos/staking";
import ToolTip from "~/renderer/components/Tooltip";
import DelegateIcon from "~/renderer/icons/Delegate";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
import { TokenAccount } from "@ledgerhq/types-live";
import { DelegateModalName } from "../modals";
import { getEnv } from "@ledgerhq/live-env";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

const Staking = ({ account }: { account: AptosAccount }) => {
  const dispatch = useDispatch();

  const stakingPositions = account.aptosResources?.stakingPositions || [];
  const mappedStakingPositions = useAptosMappedStakingPositions(account);
  const stakingEnabled = canStake(account);

  const onStake = useCallback(() => {
    dispatch(openModal("MODAL_APTOS_STAKE", { account }));
  }, [account, dispatch]);

  const onEarnRewards = useCallback(() => {
    dispatch(openModal("MODAL_APTOS_REWARDS_INFO", { account }));
  }, [account, dispatch]);

  const onRedirect = useCallback(
    (validatorAddress: string, modalName: DelegateModalName) => {
      dispatch(
        openModal(modalName, {
          account,
          validatorAddress,
        }),
      );
    },
    [account, dispatch],
  );

  const explorerView = getDefaultExplorerView(account.currency);

  const onExternalLink = useCallback(
    (address: string) => {
      const srURL = explorerView && getAddressExplorer(explorerView, address);
      if (srURL) openURL(srURL);
    },
    [explorerView],
  );

  if (getEnv("APTOS_ENABLE_STAKING") === false) return null;

  const hasStakingPositions = stakingPositions.length > 0;

  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="aptos.stake.table.header" />}
        titleProps={{
          "data-e2e": "title_Staking",
        }}
      >
        {hasStakingPositions ? (
          <ToolTip
            content={!stakingEnabled ? <Trans i18nKey="aptos.stake.minSafeWarning" /> : null}
          >
            <Button
              id={"account-stake-button"}
              mr={2}
              small
              primary
              disabled={!stakingEnabled}
              onClick={onStake}
            >
              <Box horizontal flow={1} alignItems="center">
                <DelegateIcon size={12} />
                <Box>
                  <Trans i18nKey="aptos.stake.table.stake" />
                </Box>
              </Box>
            </Button>
          </ToolTip>
        ) : null}
      </TableHeader>
      {hasStakingPositions ? (
        <>
          <Header />
          {mappedStakingPositions.map((stakingPosition, index) => (
            <Row
              key={`staking-row-${index}`}
              stakingPosition={stakingPosition}
              onManageAction={onRedirect}
              onExternalLink={onExternalLink}
            />
          ))}
        </>
      ) : (
        <Wrapper horizontal>
          <Box
            style={{
              maxWidth: "65%",
            }}
          >
            <Text ff="Inter|Medium|SemiBold" color="neutral.c70" fontSize={4}>
              <Trans
                i18nKey="aptos.stake.emptyState.description"
                values={{
                  name: account.currency.name,
                }}
              />
            </Text>
            <Box mt={2}>
              <LinkWithExternalIcon
                label={<Trans i18nKey="aptos.stake.emptyState.info" />}
                onClick={() => openURL(urls.ledgerValidator)}
              />
            </Box>
          </Box>
          <Box>
            <ToolTip
              content={!stakingEnabled ? <Trans i18nKey="aptos.stake.minSafeWarning" /> : null}
            >
              <Button primary small disabled={!stakingEnabled} onClick={onEarnRewards}>
                <Box horizontal flow={1} alignItems="center">
                  <IconChartLine size={12} />
                  <Box>
                    <Trans i18nKey="aptos.stake.emptyState.earnRewards" />
                  </Box>
                </Box>
              </Button>
            </ToolTip>
          </Box>
        </Wrapper>
      )}
    </TableContainer>
  );
};

const StakingPositions = ({ account }: { account: AptosAccount | TokenAccount }) => {
  if (account.type !== "Account") return null;
  return <Staking account={account} />;
};

export default StakingPositions;
