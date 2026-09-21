import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import {
  useAleoUnbondingState,
  type AleoStakingPositionView,
} from "@ledgerhq/live-common/families/aleo/react";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box/Box";
import Discreet from "~/renderer/components/Discreet";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import TableContainer, { HeaderWrapper, TableHeader } from "~/renderer/components/TableContainer";
import ToolTip from "~/renderer/components/Tooltip";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ClockIcon from "~/renderer/icons/Clock";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { Claim, Column, Ellipsis, TableLine, Wrapper } from "./styles";
import { AleoCustomModal } from "../constants";
import { getUnbondingStatus, type AleoUnbondingStatus } from "./utils";

const COLUMNS = [
  "aleo.stake.table.source",
  "aleo.stake.table.status",
  "aleo.stake.table.amount",
  "aleo.stake.table.completion",
];

type Props = {
  account: AleoAccount;
  position: AleoStakingPositionView;
};

const STATUS_TOOLTIPS: Record<AleoUnbondingStatus, string> = {
  claimPending: "aleo.stake.unstaking.claimPendingTooltip",
  unbondPending: "aleo.stake.unstaking.unbondPendingTooltip",
  claimable: "aleo.stake.unstaking.claimableTooltip",
  settling: "aleo.stake.unstaking.settlingTooltip",
  countingDown: "aleo.stake.unstaking.pendingTooltip",
};

const Unstakings = ({ account, position }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const unit = useAccountUnit(account);
  const { unbondingBalance, unbondingHeight, pendingKind } = position;
  const { isClaimable, isSettling, blocksLeft, currentHeight } = useAleoUnbondingState(
    account,
    position,
  );

  // One decision for both the status icon and the completion cell, so the two cannot contradict
  // each other — a green "you can claim these funds" next to "Claiming..." is unrepresentable.
  const status = getUnbondingStatus({ pendingKind, isClaimable, isSettling });
  const amountIsSynced = unbondingBalance.gt(0);

  const onClaim = useCallback(() => {
    dispatch(openModal(AleoCustomModal.CLAIM_UNBOND, { account }));
  }, [account, dispatch]);

  const renderCompletion = () => {
    switch (status) {
      case "claimPending":
        return (
          <ToolTip content={t("aleo.stake.unstaking.claimPendingTooltip")}>
            <span data-testid="aleo-claim-pending">{t("aleo.stake.unstaking.claimPending")}</span>
          </ToolTip>
        );
      case "unbondPending":
        return (
          <ToolTip content={t("aleo.stake.unstaking.unbondPendingTooltip")}>
            <span data-testid="aleo-unbond-pending">{t("aleo.stake.unstaking.unbondPending")}</span>
          </ToolTip>
        );
      case "claimable":
        return (
          <Claim onClick={onClaim} data-testid="aleo-claim-cta">
            <Trans i18nKey="aleo.stake.claim" />
          </Claim>
        );
      case "settling":
        return (
          <ToolTip content={t("aleo.stake.unstaking.settlingTooltip")}>
            <span data-testid="aleo-claim-settling">{t("aleo.stake.unstaking.settling")}</span>
          </ToolTip>
        );
      case "countingDown":
        return (
          <ToolTip
            content={
              unbondingHeight !== null
                ? t("aleo.stake.claimableAtTooltip", {
                    height: unbondingHeight,
                    current: currentHeight,
                  })
                : null
            }
          >
            <span data-testid="aleo-claim-countdown">
              {blocksLeft !== null ? t("aleo.stake.blocksRemaining", { count: blocksLeft }) : "-"}
            </span>
          </ToolTip>
        );
    }
  };

  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="aleo.stake.unstaking.header" />}
        titleProps={{ "data-e2e": "title_Unstaking" }}
        tooltip={<Trans i18nKey="aleo.stake.unstaking.headerTooltip" />}
      />

      <HeaderWrapper>
        {COLUMNS.map(column => (
          <TableLine key={column}>
            <Trans i18nKey={column} />
          </TableLine>
        ))}
      </HeaderWrapper>

      <Wrapper>
        <Column strong>
          <Box mr={2}>
            <FirstLetterIcon label={unit.name} />
          </Box>
          <Box style={{ minWidth: 0 }}>
            <ToolTip content={t("aleo.stake.unstaking.sourceTooltip")}>
              <Ellipsis>{unit.name}</Ellipsis>
            </ToolTip>
          </Box>
        </Column>

        <Column>
          <Box color={status === "claimable" ? "success.c70" : "neutral.c70"} pl={2}>
            <ToolTip content={t(STATUS_TOOLTIPS[status])}>
              <span
                data-testid="aleo-unstaking-status"
                role="img"
                aria-label={t(STATUS_TOOLTIPS[status])}
              >
                {status === "claimable" ? <CheckCircle size={14} /> : <ClockIcon size={14} />}
              </span>
            </ToolTip>
          </Box>
        </Column>

        <Column>
          {amountIsSynced ? (
            <Discreet>
              {formatCurrencyUnit(unit, unbondingBalance, {
                showCode: true,
                disableRounding: true,
              })}
            </Discreet>
          ) : (
            "-"
          )}
        </Column>

        <Column>{renderCompletion()}</Column>
      </Wrapper>
    </TableContainer>
  );
};

export default Unstakings;
