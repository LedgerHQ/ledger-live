import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import type { HederaAccount, HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { useStake } from "LLD/hooks/useStake";
import { Flex } from "@ledgerhq/react-ui";
import { TokenAccount } from "@ledgerhq/types-live";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import DelegateIcon from "~/renderer/icons/Delegate";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Text from "~/renderer/components/Text";
import IconChartLine from "~/renderer/icons/ChartLine";
import { urls } from "~/config/urls";
import type { DelegateModalName } from "../modals";
import { Header } from "./Header";
import { Row } from "./Row";

const Delegations = ({ account }: { account: HederaAccount }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { getCanStakeCurrency } = useStake();

  const explorerView = getDefaultExplorerView(account.currency);
  const isStakingEnabled = getCanStakeCurrency(account.currency.id);

  const onDelegate = useCallback(() => {
    dispatch(openModal("MODAL_HEDERA_DELEGATE", { account }));
  }, [account, dispatch]);

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
    (validator: HederaValidator) => {
      const srURL = explorerView && getAddressExplorer(explorerView, validator.address);
      if (srURL) openURL(srURL);
    },
    [explorerView],
  );

  const onHowItWorks = useCallback(() => {
    openURL(urls.hedera.staking);
  }, []);

  if (!isStakingEnabled) {
    return null;
  }

  if (!account.hederaResources?.delegation) {
    return (
      <TableContainer mb={6}>
        <TableHeader
          title={<Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.header" />}
          titleProps={{ "data-e2e": "title_Staking" }}
        />
        <Wrapper horizontal>
          <Box style={{ maxWidth: "65%" }}>
            <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
              <Trans i18nKey="delegation.delegationEarn" values={{ name: account.currency.name }} />
            </Text>
            <Box mt={2}>
              <LinkWithExternalIcon label={t("delegation.howItWorks")} onClick={onHowItWorks} />
            </Box>
          </Box>
          <Box>
            <Button primary id="account-delegate-button" onClick={onDelegate}>
              <Flex flexDirection="row" columnGap={1} alignItems="center">
                <IconChartLine size={12} />
                <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.header" />
              </Flex>
            </Button>
          </Box>
        </Wrapper>
      </TableContainer>
    );
  }

  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.header" />}
        titleProps={{ "data-e2e": "title_Staking" }}
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

const CustomButton = styled(Button)`
  border: none;
`;

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

export default DelegatedPositions;
