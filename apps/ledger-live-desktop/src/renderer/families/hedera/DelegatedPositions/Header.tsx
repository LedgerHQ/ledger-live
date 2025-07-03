import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box/Box";
import { HeaderWrapper } from "~/renderer/components/TableContainer";

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

export function Header() {
  return (
    <HeaderWrapper>
      <TableLine>
        <Trans i18nKey="delegation.validator" />
      </TableLine>
      <TableLine>
        <Trans i18nKey="delegation.status" />
      </TableLine>
      <TableLine>
        <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.columns.delegated" />
      </TableLine>
      <TableLine>
        <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.columns.rewards" />
      </TableLine>
      <TableLine />
    </HeaderWrapper>
  );
}
