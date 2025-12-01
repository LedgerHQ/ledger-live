import { SuiAccount } from "@ledgerhq/live-common/families/sui/types";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { urls } from "~/config/urls";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import IconChartLine from "~/renderer/icons/ChartLine";
import DelegateIcon from "~/renderer/icons/Delegate";
import { openURL } from "~/renderer/linking";
import { Header } from "./Header";
import { P2P_SUI_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/sui/constants";
import { openModal } from "~/renderer/actions/modals";
import { DelegateModalName } from "../modals";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { canStake } from "@ledgerhq/live-common/families/sui/logic";
import { useSuiMappedStakingPositions } from "@ledgerhq/live-common/families/sui/react";
import ToolTip from "~/renderer/components/Tooltip";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import { Row } from "./Row";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
const Staking = ({ account }: { account: SuiAccount }) => {
  const dispatch = useDispatch();
  const { suiResources = {} } = account;
  const { stakes = [] } = suiResources;
  const mappedStakingPositions = useSuiMappedStakingPositions(account);
  const stakingEnabled = canStake(account);
  const onStake = useCallback(() => {
    dispatch(openModal("MODAL_SUI_DELEGATE", { account }));
  }, [account, dispatch]);

  const onRedirect = useCallback(
    (
      validatorAddress: string,
      stakedSuiId: string,
      amount: string,
      modalName: DelegateModalName,
    ) => {
      dispatch(
        openModal(modalName, {
          account,
          amount,
          validatorAddress,
          stakedSuiId,
        }),
      );
    },
    [account, dispatch],
  );
  const explorerView = getDefaultExplorerView(account.currency);
  const onExternalLink = useCallback(
    (address: string) => {
      if (address === P2P_SUI_VALIDATOR_ADDRESS) {
        openURL(urls.ledgerValidator);
      } else {
        const srURL = explorerView && getAddressExplorer(explorerView, address);
        if (srURL) openURL(srURL);
      }
    },
    [explorerView],
  );
  const hasStakingPositions = stakes.length > 0;
  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="sui.stake.table.header" />}
        titleProps={{
          "data-e2e": "title_Staking",
        }}
      >
        {hasStakingPositions ? (
          <ToolTip content={!stakingEnabled ? <Trans i18nKey="sui.stake.minSafeWarning" /> : null}>
            <Button
              id={"account-stake-button"}
              mr={2}
              color="palette.primary.main"
              small
              disabled={!stakingEnabled}
              onClick={onStake}
            >
              <Box horizontal flow={1} alignItems="center">
                <DelegateIcon size={12} />
                <Box>
                  <Trans i18nKey="sui.stake.table.stake" />
                </Box>
              </Box>
            </Button>
          </ToolTip>
        ) : null}
      </TableHeader>
      {hasStakingPositions ? (
        <>
          <Header />
          {mappedStakingPositions.map(stakingPosition => (
            <Row
              key={stakingPosition.stakedSuiId}
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
            <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
              <Trans
                i18nKey="sui.stake.emptyState.description"
                values={{
                  name: account.currency.name,
                }}
              />
            </Text>
            <Box mt={2}>
              {urls.sui.stakingRewards && (
                <LinkWithExternalIcon
                  label={<Trans i18nKey="sui.stake.emptyState.info" />}
                  onClick={() => openURL(urls.sui.stakingRewards)}
                />
              )}
            </Box>
          </Box>
          <Box>
            <ToolTip
              content={!stakingEnabled ? <Trans i18nKey="sui.stake.minSafeWarning" /> : null}
            >
              <Button primary small disabled={!stakingEnabled} onClick={onStake}>
                <Box horizontal flow={1} alignItems="center">
                  <IconChartLine size={12} />
                  <Box>
                    <Trans i18nKey="sui.stake.emptyState.earnRewards" />
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
const StakingPositions = ({ account }: { account: SuiAccount }) => {
  if (account.type !== "Account") return null;
  return <Staking account={account} />;
};

export default StakingPositions;
