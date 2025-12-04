import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import type {
  HederaAccount,
  HederaDelegation,
  HederaEnrichedDelegation,
} from "@ledgerhq/live-common/families/hedera/types";
import { useHederaEnrichedDelegation } from "@ledgerhq/live-common/families/hedera/react";
import { useStake } from "LLD/hooks/useStake";
import type { TokenAccount } from "@ledgerhq/types-live";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import DelegateIcon from "~/renderer/icons/Delegate";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import type { DelegateModalName } from "../modals";
import { Header } from "./Header";
import { Row } from "./Row";
import DelegationPlaceholder from "./DelegationPlaceholder";

const Delegations = ({
  account,
  delegatedPosition,
}: {
  account: HederaAccount;
  delegatedPosition: HederaDelegation;
}) => {
  const dispatch = useDispatch();
  const enrichedDelegation = useHederaEnrichedDelegation(account, delegatedPosition);

  const onClaimRewards = useCallback(() => {
    dispatch(openModal("MODAL_HEDERA_CLAIM_REWARDS", { account }));
  }, [account, dispatch]);

  const onRedirect = useCallback(
    (modalName: DelegateModalName) => {
      dispatch(openModal(modalName, { account }));
    },
    [account, dispatch],
  );

  const onExternalLink = useCallback(
    (enrichedDelegation: HederaEnrichedDelegation) => {
      const { address } = enrichedDelegation.validator;
      const explorerView = getDefaultExplorerView(account.currency);
      const srURL = explorerView && address && getAddressExplorer(explorerView, address);
      if (srURL) openURL(srURL);
    },
    [account],
  );

  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.header" />}
        titleProps={{ "data-e2e": "title_Staking" }}
      >
        {enrichedDelegation.pendingReward.gt(0) && (
          <CustomButton id="account-stake-button" onClick={onClaimRewards} small outline>
            <Box horizontal flow={1} alignItems="center">
              <DelegateIcon size={12} />
              <Box>
                <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.button" />
              </Box>
            </Box>
          </CustomButton>
        )}
      </TableHeader>
      <Header />
      <Row
        account={account}
        enrichedDelegation={enrichedDelegation}
        onManageAction={onRedirect}
        onExternalLink={onExternalLink}
      />
    </TableContainer>
  );
};

const DelegatedPositions = ({ account }: { account: HederaAccount | TokenAccount }) => {
  const { getCanStakeCurrency } = useStake();

  if (account.type !== "Account") {
    return null;
  }

  const { delegation } = account.hederaResources ?? {};
  const isStakingEnabled = getCanStakeCurrency(account.currency.id);

  if (!isStakingEnabled) {
    return null;
  }

  if (!delegation) {
    return <DelegationPlaceholder account={account} />;
  }

  return <Delegations account={account} delegatedPosition={delegation} />;
};

const CustomButton = styled(Button)`
  border: none;
`;

export default DelegatedPositions;
