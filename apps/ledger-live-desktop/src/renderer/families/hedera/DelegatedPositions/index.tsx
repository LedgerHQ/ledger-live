import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import type { HederaAccount, HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { TokenAccount } from "@ledgerhq/types-live";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import DelegateIcon from "~/renderer/icons/Delegate";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import type { DelegateModalName } from "../modals";
import { Header } from "./Header";
import { Row } from "./Row";

const CustomButton = styled(Button)`
  border: none;
`;

const Delegations = ({ account }: { account: HederaAccount }) => {
  const dispatch = useDispatch();

  const onClaimRewards = useCallback(() => {
    dispatch(openModal("MODAL_HEDERA_CLAIM_REWARDS", { account }));
  }, [account, dispatch]);

  const onRedirect = useCallback(
    (modalName: DelegateModalName) => {
      dispatch(openModal(modalName, { account }));
    },
    [account, dispatch],
  );

  const explorerView = getDefaultExplorerView(account.currency);

  const onExternalLink = useCallback(
    (validator: HederaValidator) => {
      const srURL = explorerView && getAddressExplorer(explorerView, validator.address);
      if (srURL) openURL(srURL);
    },
    [explorerView],
  );

  if (!account.hederaResources?.delegation) {
    return null;
  }

  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.header" />}
        titleProps={{
          "data-e2e": "title_Staking",
        }}
      >
        {account.hederaResources.delegation.pendingReward.gt(0) && (
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
        delegatedPosition={account.hederaResources.delegation}
        onManageAction={onRedirect}
        onExternalLink={onExternalLink}
      />
    </TableContainer>
  );
};

const DelegatedPositions = ({ account }: { account: HederaAccount | TokenAccount }) => {
  if (account.type !== "Account") return null;

  return <Delegations account={account} />;
};

export default DelegatedPositions;
