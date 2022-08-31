// @flow

import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import Text from "~/renderer/components/Text";
import IconChartLine from "~/renderer/icons/ChartLine";
import { openURL } from "~/renderer/linking";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { Header } from "./Header";
import { Row } from "./Row";
import {
  availablePendingWithdrawals,
  activatableVotes,
  isAccountRegistrationPending,
} from "@ledgerhq/live-common/families/celo/logic";
import * as S from "./AccountBodyHeader.styles";
import type { Account } from "@ledgerhq/types-live";
import type { CeloVote } from "@ledgerhq/live-common/families/celo/types";

type Props = {
  account: Account,
};

const AccountBodyHeaderComponent = ({ account }: Props) => {
  const { celoResources } = account;
  invariant(celoResources, "celo account and resources expected");
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const isRegistrationPending = isAccountRegistrationPending(account?.id, accounts);
  const { votes } = celoResources;

  const onEarnRewards = useCallback(() => {
    dispatch(
      openModal("MODAL_CELO_REWARDS_INFO", {
        account,
      }),
    );
  }, [account, dispatch]);

  const onActivate = useCallback(() => {
    dispatch(
      openModal("MODAL_CELO_ACTIVATE", {
        account,
      }),
    );
  }, [account, dispatch]);

  const onWithdraw = useCallback(() => {
    dispatch(
      openModal("MODAL_CELO_WITHDRAW", {
        account,
      }),
    );
  }, [account, dispatch]);

  const onRedirect = useCallback(
    (vote: CeloVote, modalName: string) => {
      dispatch(
        openModal(modalName, {
          account,
          vote,
        }),
      );
    },
    [account, dispatch],
  );

  const explorerView = getDefaultExplorerView(account.currency);
  const withdrawEnabled = availablePendingWithdrawals(account).length;
  const activatingEnabled = activatableVotes(account).length;

  const onExternalLink = useCallback(
    (vote: CeloVote) => {
      const url = getAddressExplorer(explorerView, vote.validatorGroup);

      if (url) {
        openURL(url);
      }
    },
    [explorerView],
  );

  const hasVotes = votes.length > 0;

  return (
    <>
      {!!withdrawEnabled && (
        <Alert
          type="warning"
          learnMoreLabel={<Trans i18nKey="celo.withdraw.title" />}
          learnMoreOnRight
          onLearnMore={onWithdraw}
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
          onLearnMore={onActivate}
          learnMoreIsInternal={true}
          mb={3}
        >
          <Trans i18nKey={`celo.alerts.activatableVotes`} />
        </Alert>
      )}
      <TableContainer mb={6}>
        <TableHeader title={<Trans i18nKey="celo.delegation.listHeader" />} />
        {hasVotes ? (
          <>
            <Header />
            {votes.map(vote => (
              <Row
                vote={vote}
                key={vote.validatorGroup + vote.index}
                account={account}
                onManageAction={onRedirect}
                onExternalLink={onExternalLink}
              />
            ))}
          </>
        ) : (
          <S.Wrapper horizontal>
            <Box style={{ maxWidth: "65%" }}>
              <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
                <Trans
                  i18nKey="celo.delegation.emptyState.description"
                  values={{ name: account.currency.name }}
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
              <Button primary small onClick={onEarnRewards} disabled={isRegistrationPending}>
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
          </S.Wrapper>
        )}
      </TableContainer>
    </>
  );
};

const AccountBodyHeader = ({ account }: Props) => {
  if (!account.celoResources) return null;

  return <AccountBodyHeaderComponent account={account} />;
};

export default AccountBodyHeader;
