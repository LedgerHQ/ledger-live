import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box/Box";
import { HeaderWrapper } from "~/renderer/components/TableContainer";
import ToolTip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";

const TitleWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  gap: "4px",
  mb: 1,
}))``;

export const TableLine = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "palette.text.shade60",
  horizontal: true,
  alignItems: "center",
  justifyContent: "flex-start",
  fontSize: 3,
  flex: 1.125,
  pr: 2,
}))`
  box-sizing: border-box;
  &:last-child {
    justify-content: flex-end;
    flex: 0.5;
    text-align: right;
    white-space: nowrap;
  }
`;
export const Header = () => (
  <HeaderWrapper>
    <TableLine>
      <Trans i18nKey="delegation.validator" />
    </TableLine>
    <TableLine>
      <Trans i18nKey="delegation.status" />
    </TableLine>
    <TableLine>
      <Trans i18nKey="sui.stake.table.staked" />
    </TableLine>
    <TableLine>
      <ToolTip content={<Trans i18nKey="sui.stake.table.rewardTooltip" />}>
        <TitleWrapper>
          <Trans i18nKey="sui.stake.table.estimatedReward" />
          <InfoCircle size={13} />
        </TitleWrapper>
      </ToolTip>
    </TableLine>
    <TableLine />
  </HeaderWrapper>
);
