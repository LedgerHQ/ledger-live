import { Trans } from "react-i18next";
import styled from "styled-components";
import { useHistory } from "react-router";
import {
  availablePendingWithdrawals,
  activatableVotes,
  isAccountRegistrationPending,
} from "@ledgerhq/coin-evm/currencyHelpers/celo";
import React, { memo, useCallback } from "react";
import { CeloVote } from "@ledgerhq/coin-evm/types/index";
import { EvmAccount } from "@ledgerhq/coin-evm/types/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import IconChartLine from "~/renderer/icons/ChartLine";
import ButtonV3 from "~/renderer/components/ButtonV3";
import Button from "~/renderer/components/Button";
import Alert from "~/renderer/components/Alert";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import { EvmFamily } from "../../types";
import { urls } from "~/config/urls";
import { Header } from "./Header";
import Row from "./Row";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

const CeloAccountBodyHeaderComponent = ({ account }: { account: EvmAccount }) => {
  const { evmResources } = account;
  const { votes } = evmResources || {};
  const history = useHistory();
  const isRegistrationPending = isAccountRegistrationPending(account);
  const withdrawEnabled = availablePendingWithdrawals(account).length;
  const activatingEnabled = activatableVotes(account).length;
  const explorerView = getDefaultExplorerView(account.currency);
  const onExternalLink = useCallback(
    (vote: CeloVote) => {
      const url = getAddressExplorer(explorerView, vote.validatorGroup);
      if (url) {
        openURL(url);
      }
    },
    [explorerView],
  );

  const manageStaking = useCallback(
    () =>
      history.push({
        pathname: "/platform/stakekit",
        state: {
          yieldId: "celo-celo-native-staking",
          pendingaction: "locked",
          accountId: account.id,
          returnTo: `/account/${account.id}`,
        },
      }),
    [account.id, history],
  );

  return (
    <>
      {!!withdrawEnabled && (
        <Alert
          type="warning"
          learnMoreLabel={<Trans i18nKey="celo.withdraw.title" />}
          learnMoreOnRight
          learnMoreIsInternal={true}
          mb={3}
        >
          <Trans i18nKey={`celo.alerts.withdrawableAssets`} />
        </Alert>
      )}
      {!!activatingEnabled && (
        <Alert
          type="warning"
          learnMoreLabel={<Trans i18nKey="celo.activate.title" />}
          learnMoreOnRight
          learnMoreIsInternal={true}
          mb={3}
        >
          <Trans i18nKey={`celo.alerts.activatableVotes`} />
        </Alert>
      )}
      <TableContainer mb={6}>
        <TableHeader title={<Trans i18nKey="celo.delegation.listHeader" />}>
          <ButtonV3 variant={"color"} size={"medium"} onClick={manageStaking}>
            Manage
          </ButtonV3>
        </TableHeader>
        {votes && votes.length > 0 ? (
          <>
            <Header />
            {votes.map(vote => (
              <Row
                vote={vote}
                key={`${vote.validatorGroup}${vote.index}`}
                account={account}
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
                  i18nKey="celo.delegation.emptyState.description"
                  values={{
                    name: account.currency.name,
                  }}
                />
              </Text>
              <Box mt={2}>
                <LinkWithExternalIcon
                  label={<Trans i18nKey="celo.delegation.emptyState.info" />}
                  onClick={() => openURL(urls.celo.learnMore)}
                />
              </Box>
            </Box>
            <Box>
              <Button primary small disabled={isRegistrationPending}>
                <Box horizontal flow={1} alignItems="center">
                  <IconChartLine size={12} />
                  <Box>
                    {isRegistrationPending ? (
                      <Trans i18nKey="celo.manage.titleWhenPendingRegistration" />
                    ) : (
                      <Trans i18nKey="celo.delegation.emptyState.delegation" />
                    )}
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

const CeloAccountBodyHeader: EvmFamily["AccountBodyHeader"] = ({ account, ...otherProps }) => {
  if (account.type !== "Account" || !account.evmResources) return null;

  return <CeloAccountBodyHeaderComponent account={account} {...otherProps} />;
};

export default memo(CeloAccountBodyHeader);
