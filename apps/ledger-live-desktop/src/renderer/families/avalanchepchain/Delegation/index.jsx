// @flow
import React, { useCallback } from "react";
import { getDefaultExplorerView, getTransactionExplorer } from "@ledgerhq/live-common/explorers";
import type { Account } from "@ledgerhq/live-common/lib/types";
import invariant from "invariant";
import { useDispatch } from "react-redux";
import { Row } from "./Row";
import { Header } from "./Header";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import Text from "~/renderer/components/Text";
import IconChartLine from "~/renderer/icons/ChartLine";
import DelegateIcon from "~/renderer/icons/Delegate";
import { Trans } from "react-i18next";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import Alert from "~/renderer/components/Alert";
import { canDelegate } from "@ledgerhq/live-common/families/avalanchepchain/utils";

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

const Delegation = ({ account }: Props) => {
  const dispatch = useDispatch();

  const { avalanchePChainResources } = account;
  invariant(avalanchePChainResources, "avalanche (P-Chain) account and resources expected");

  const { delegations } = avalanchePChainResources;

  const onEarnRewards = useCallback(() => {
    dispatch(
      openModal("MODAL_AVALANCHE_REWARDS_INFO", {
        account,
      }),
    );
  }, [account, dispatch]);

  const onDelegate = useCallback(() => {
    dispatch(
      openModal("MODAL_AVALANCHE_DELEGATE", {
        account,
      }),
    );
  }, [account, dispatch]);

  const explorerView = getDefaultExplorerView(account.currency);
  const isDelegationEnabled = canDelegate(account);

  const onExternalLink = useCallback(
    (address: string) => {
      const url = explorerView && getTransactionExplorer(explorerView, address);

      if (url) {
        openURL(url);
      }
    },
    [explorerView],
  );

  const hasDelegations = delegations.length > 0;

  return (
    <>
      {!isDelegationEnabled && (
        <Alert type="warning" learnMoreUrl={urls.avalanche.learnMoreStakingParameters} mb={3}>
          <Trans i18nKey={`avalanchepchain.delegation.notEnoughToDelegate`} />
        </Alert>
      )}
      <TableContainer mb={6}>
        <TableHeader title={<Trans i18nKey="avalanchepchain.delegation.header" />}>
          {isDelegationEnabled && hasDelegations && (
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
                  <Trans i18nKey="avalanchepchain.delegation.add" />
                </Box>
              </Box>
            </Button>
          )}
        </TableHeader>
        {hasDelegations ? (
          <>
            <Header />
            {delegations.map(delegation => (
              <Row
                delegation={delegation}
                account={account}
                onExternalLink={onExternalLink}
                key={delegation.txID}
              />
            ))}
          </>
        ) : (
          <Wrapper horizontal>
            <Box style={{ maxWidth: "65%" }}>
              <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
                <Trans
                  i18nKey="avalanchepchain.delegation.emptyState.description"
                  values={{ name: account.currency.name }}
                />
              </Text>
              <Box mt={2}>
                <LinkWithExternalIcon
                  label={<Trans i18nKey="avalanchepchain.delegation.emptyState.info" />}
                  onClick={() => openURL(urls.avalanche.learnMore)}
                />
              </Box>
            </Box>
            <Box>
              <Button primary small onClick={onEarnRewards} disabled={!isDelegationEnabled}>
                <Box horizontal flow={1} alignItems="center">
                  <IconChartLine size={12} />
                  <Box>
                    <Trans i18nKey="avalanchepchain.delegation.emptyState.delegation" />
                  </Box>
                </Box>
              </Button>
            </Box>
          </Wrapper>
        )}
      </TableContainer>
    </>
  );
};

const Delegations = ({ account }: Props) => {
  if (!account.avalanchePChainResources) return null;

  return <Delegation account={account} />;
};

export default Delegations;
