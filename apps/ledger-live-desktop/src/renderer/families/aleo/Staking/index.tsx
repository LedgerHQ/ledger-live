import React, { Fragment, useCallback } from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useAleoStakingPosition } from "@ledgerhq/live-common/families/aleo/react";
import { hasPendingOperationType } from "@ledgerhq/live-common/families/aleo/utils";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import IconChartLine from "~/renderer/icons/ChartLine";
import TableContainer, { HeaderWrapper, TableHeader } from "~/renderer/components/TableContainer";
import { getAleoCurrencyConfig } from "../shared/utils";
import { AleoCustomModal } from "../constants";
import { TableLine } from "./styles";
import StakedRow from "./StakedRow";
import StakingSummary from "./StakingSummary";
import Unstakings from "./Unstakings";

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
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const position = useAleoStakingPosition(account);

  // Aleo holds one bonded position per account: a second bond sent while one is pending is a fee
  // spent on a transaction the chain will reject.
  const bondPending = hasPendingOperationType(account, "BOND");

  const onEarnRewards = useCallback(() => {
    dispatch(openModal(AleoCustomModal.BOND_PUBLIC, { account }));
  }, [account, dispatch]);
  const onManage = useCallback(() => {
    dispatch(openModal(AleoCustomModal.MANAGE, { account }));
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

        {position.hasBonded ? (
          <Fragment>
            <StakingSummary account={account} position={position} />

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
              <ToolTip content={bondPending ? t("aleo.stake.emptyState.bondPendingTooltip") : null}>
                <Button primary small disabled={bondPending} onClick={onEarnRewards}>
                  <Box horizontal flow={1} alignItems="center">
                    <IconChartLine size={12} />
                    <Box>
                      <Trans i18nKey="aleo.stake.emptyState.earnRewards" />
                    </Box>
                  </Box>
                </Button>
              </ToolTip>
            </Box>
          </EmptyStateWrapper>
        )}
      </TableContainer>

      {position.hasUnbonding || position.hasPendingUnbondingChange ? (
        <Unstakings account={account} position={position} />
      ) : null}
    </Fragment>
  );
};

const StakingSection = ({ account }: { account: AleoAccount | TokenAccount }) => {
  if (account.type !== "Account") return null;
  // Gated out here rather than inside `Staking`: its hooks fetch the validator list and poll the
  // chain tip, neither of which exists to be read while staking is off.
  if (!getAleoCurrencyConfig(account.currency)?.enableStaking) return null;

  return <Staking account={account} />;
};

export default StakingSection;
