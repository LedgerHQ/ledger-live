import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { useSolanaStakesWithMeta } from "@ledgerhq/live-common/families/solana/react";
import { SolanaAccount, SolanaStakeWithMeta } from "@ledgerhq/live-common/families/solana/types";
import { Account, SubAccount } from "@ledgerhq/types-live";
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
import { DelegateModalName } from "../modals";

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
const Delegation = ({ account }: { account: SolanaAccount }) => {
  const { solanaResources } = account;
  const dispatch = useDispatch();
  const stakesWithMeta = useSolanaStakesWithMeta(account.currency, solanaResources.stakes);
  const onEarnRewards = useCallback(() => {
    dispatch(
      openModal("MODAL_SOLANA_REWARDS_INFO", {
        account,
      }),
    );
  }, [account, dispatch]);
  const onDelegate = useCallback(() => {
    dispatch(
      openModal("MODAL_SOLANA_DELEGATE", {
        account,
      }),
    );
  }, [account, dispatch]);
  const onRedirect = useCallback(
    (stakeWithMeta: SolanaStakeWithMeta, modalName: DelegateModalName) => {
      dispatch(
        openModal(modalName, {
          account,
          stakeWithMeta,
        }),
      );
    },
    [account, dispatch],
  );
  const explorerView = getDefaultExplorerView(account.currency);
  const onExternalLink = useCallback(
    ({ meta, stake }: SolanaStakeWithMeta) => {
      const url =
        meta.validator?.url ??
        (stake.delegation?.voteAccAddr &&
          explorerView &&
          getAddressExplorer(explorerView, stake.delegation.voteAccAddr));
      if (url) {
        openURL(url);
      }
    },
    [explorerView],
  );
  const hasStakes = stakesWithMeta.length > 0;
  return (
    <>
      {hasStakes ? (
        <TableContainer mb={6}>
          <TableHeader title={<Trans i18nKey="solana.delegation.listHeader" />}>
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
                  <Trans i18nKey="solana.delegation.delegate" />
                </Box>
              </Box>
            </Button>
          </TableHeader>

          <Header />
          {stakesWithMeta.map(stakeWithMeta => (
            <Row
              stakeWithMeta={stakeWithMeta}
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
const Delegations = ({ account }: { account: SolanaAccount | SubAccount }) => {
  if (account.type !== "Account") return null;
  return <Delegation account={account} />;
};
export default Delegations;
