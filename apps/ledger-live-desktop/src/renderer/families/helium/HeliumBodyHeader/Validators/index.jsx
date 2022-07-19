// @flow

import { getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import type { Account } from "@ledgerhq/live-common/types/index";
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import Text from "~/renderer/components/Text";
import IconChartLine from "~/renderer/icons/ChartLine";
import StakeIcon from "~/renderer/icons/Coins";
import { openURL } from "~/renderer/linking";
import { Header } from "./Header";
import { Row } from "./Row";
import styled from "styled-components";

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

type EarnRewardsCTAProps = {
  account: Account,
  onEarnRewards: () => void,
};

function EarnRewardsCTA({ account, onEarnRewards }: EarnRewardsCTAProps) {
  return (
    <Wrapper horizontal>
      <Box style={{ maxWidth: "65%" }}>
        <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
          <Trans
            i18nKey="helium.delegation.emptyState.description"
            values={{ name: account.currency.name }}
          />
        </Text>
        <Box mt={2}>
          <LinkWithExternalIcon
            label={<Trans i18nKey="helium.delegation.emptyState.info" />}
            onClick={() => openURL(urls.helium.staking)}
          />
        </Box>
      </Box>
      <Box>
        <Button primary small onClick={onEarnRewards}>
          <Box horizontal flow={1} alignItems="center">
            <IconChartLine size={12} />
            <Box>
              <Trans i18nKey="helium.delegation.emptyState.delegation" />
            </Box>
          </Box>
        </Button>
      </Box>
    </Wrapper>
  );
}

const Validators = ({ account }: Props) => {
  const { heliumResources } = account;
  invariant(heliumResources, "helium account and resources expected");

  const dispatch = useDispatch();

  const validators = heliumResources.stakes;

  const onEarnRewards = useCallback(() => {
    dispatch(
      openModal("MODAL_HELIUM_REWARDS_INFO", {
        account,
      }),
    );
  }, [account, dispatch]);

  const onDelegate = useCallback(() => {
    dispatch(
      openModal("MODAL_HELIUM_STAKE", {
        account,
      }),
    );
  }, [account, dispatch]);

  const onRedirect = useCallback(
    (validator: any, modalName: string) => {
      dispatch(
        openModal(modalName, {
          account,
          validator,
        }),
      );
    },
    [account, dispatch],
  );

  const explorerView = getDefaultExplorerView(account.currency);

  const onExternalLink = useCallback(
    (validator: any) => {
      const url = "";

      if (url) {
        openURL(url);
      }
    },
    [explorerView],
  );

  const hasValidators = validators.length > 0;

  return (
    <>
      {hasValidators ? (
        <TableContainer mb={6}>
          <TableHeader title={<Trans i18nKey="helium.delegation.listHeader" />}>
            <Button
              id={"account-delegate-button"}
              mr={2}
              color="palette.primary.main"
              small
              onClick={onDelegate}
            >
              <Box horizontal flow={1} alignItems="center">
                <StakeIcon size={12} />
                <Box>
                  <Trans i18nKey="account.stake" />
                </Box>
              </Box>
            </Button>
          </TableHeader>

          <Header />
          {validators.map(validator => (
            <Row
              validator={validator}
              key={validator.address}
              account={account}
              onManageAction={onRedirect}
              onExternalLink={onExternalLink}
            />
          ))}
        </TableContainer>
      ) : null}

      {!hasValidators && account.spendableBalance.gt(0) ? (
        <TableContainer mb={6}>
          <EarnRewardsCTA account={account} onEarnRewards={onEarnRewards} />
        </TableContainer>
      ) : null}
    </>
  );
};

export default Validators;
