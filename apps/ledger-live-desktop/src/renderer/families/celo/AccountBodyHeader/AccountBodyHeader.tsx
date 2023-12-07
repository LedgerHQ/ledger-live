import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
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
import { Header } from "./Header";
import { Row } from "./Row";
import {
  availablePendingWithdrawals,
  activatableVotes,
  isAccountRegistrationPending,
} from "@ledgerhq/live-common/families/celo/logic";
import * as S from "./AccountBodyHeader.styles";
import { CeloAccount, CeloVote } from "@ledgerhq/live-common/families/celo/types";
import { ModalActions } from "../modals";
import { CeloFamily } from "../types";
type Props = {
  account: CeloAccount;
};
const AccountBodyHeaderComponent = ({ account }: Props) => {
  const {
    celoResources: { votes },
  } = account;
  const dispatch = useDispatch();
  const isRegistrationPending = isAccountRegistrationPending(account);
  const onEarnRewards = useCallback(() => {
    dispatch(
      openModal("MODAL_CELO_REWARDS_INFO", {
        account,
        parentAccount: null, // TODO check if the modal shouldn't just take a CeloAccount
      }),
    );
  }, [account, dispatch]);
  const onActivate = useCallback(() => {
    dispatch(
      openModal("MODAL_CELO_ACTIVATE", {
        account,
        parentAccount: null, // TODO check if the modal shouldn't just take a CeloAccount
      }),
    );
  }, [account, dispatch]);
  const onWithdraw = useCallback(() => {
    dispatch(
      openModal("MODAL_CELO_WITHDRAW", {
        account,
        parentAccount: null, // TODO check if the modal shouldn't just take a CeloAccount
      }),
    );
  }, [account, dispatch]);
  const onRedirect = useCallback(
    (vote: CeloVote, modalName: ModalActions) => {
      dispatch(
        openModal(modalName, {
          account,
          parentAccount: null, // TODO check if the modal shouldn't just take a CeloAccount
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
        {votes && votes.length > 0 ? (
          <>
            <Header />
            {votes.map(vote => (
              <Row
                vote={vote}
                key={`${vote.validatorGroup}${vote.index}`}
                account={account}
                onManageAction={onRedirect}
                onExternalLink={onExternalLink}
              />
            ))}
          </>
        ) : (
          <S.Wrapper horizontal>
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
const AccountBodyHeader: CeloFamily["AccountBodyHeader"] = ({ account }) => {
  return account.type === "Account" ? <AccountBodyHeaderComponent account={account} /> : null;
};
export default AccountBodyHeader;
