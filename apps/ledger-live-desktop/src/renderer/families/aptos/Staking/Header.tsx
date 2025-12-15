import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box/Box";
import { HeaderWrapper } from "~/renderer/components/TableContainer";

export const TableLine = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "neutral.c70",
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
      <Trans i18nKey="aptos.stake.table.active" />
    </TableLine>
    <TableLine>
      <Trans i18nKey="aptos.stake.table.pendingInactive" />
    </TableLine>
    <TableLine>
      <Trans i18nKey="aptos.stake.table.inactive" />
    </TableLine>
    <TableLine>
      <Trans i18nKey="aptos.stake.table.nextUnlock" />
    </TableLine>
    <TableLine />
  </HeaderWrapper>
);
