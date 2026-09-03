import React, { Fragment, useCallback } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import IconChartLine from "~/renderer/icons/ChartLine";
import TableContainer, { HeaderWrapper, TableHeader } from "~/renderer/components/TableContainer";
import { TableLine } from "../blocks/Staking";
import StakedRow from "./StakedRow";
import StakingSummary from "./StakingSummary";
import Unstakings from "./Unstakings";
import { useStakingPosition } from "./useStakingPosition";

const COLUMNS = [
  "aleo.stake.table.validator",
  "aleo.stake.table.status",
  "aleo.stake.table.staked",
  "aleo.stake.table.rate",
];

const EmptyStateWrapper = styled(Box).attrs(() => ({ p: 3 }))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

const Staking = ({ account }: { account: AleoAccount }) => {
  const dispatch = useDispatch();
  const position = useStakingPosition(account);

  const onEarnRewards = useCallback(() => {
    dispatch(openModal("MODAL_ALEO_BOND_PUBLIC", { account }));
  }, [account, dispatch]);
  const onManage = useCallback(() => {
    dispatch(openModal("MODAL_ALEO_MANAGE", { account }));
  }, [account, dispatch]);

  return (
    <Fragment>
      <TableContainer mb={6}>
        <TableHeader
          title={<Trans i18nKey="aleo.stake.table.header" />}
          titleProps={{ "data-e2e": "title_Staking" }}
        >
          {position.hasBonded ? (
            <Button id="account-manage-staking-button" color="primary.c80" small onClick={onManage}>
              <Trans i18nKey="aleo.stake.table.manage" />
            </Button>
          ) : null}
        </TableHeader>

        {position.hasBonded ? <StakingSummary account={account} position={position} /> : null}

        {position.hasBonded ? (
          <Fragment>
            <HeaderWrapper>
              {COLUMNS.map(column => (
                <TableLine key={column}>
                  <Trans i18nKey={column} />
                </TableLine>
              ))}
            </HeaderWrapper>

            <StakedRow account={account} position={position} />
          </Fragment>
        ) : (
          <EmptyStateWrapper horizontal>
            <Box style={{ maxWidth: "65%" }}>
              <Text ff="Inter|Medium|SemiBold" color="neutral.c70" fontSize={4}>
                <Trans
                  i18nKey="aleo.stake.emptyState.description"
                  values={{ name: account.currency.name }}
                />
              </Text>
            </Box>
            <Box>
              <Button primary small onClick={onEarnRewards}>
                <Box horizontal flow={1} alignItems="center">
                  <IconChartLine size={12} />
                  <Box>
                    <Trans i18nKey="aleo.stake.emptyState.earnRewards" />
                  </Box>
                </Box>
              </Button>
            </Box>
          </EmptyStateWrapper>
        )}
      </TableContainer>

      {position.hasUnbonding ? <Unstakings account={account} position={position} /> : null}
    </Fragment>
  );
};

const StakingSection = ({ account }: { account: AleoAccount | TokenAccount }) => {
  if (account.type !== "Account") return null;
  return <Staking account={account} />;
};

export default StakingSection;
