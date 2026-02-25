import { Flex } from "@ledgerhq/react-ui";
import { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex/index";
import React from "react";
import styled from "styled-components";

import LoadingPlaceholder from "~/renderer/components/LoadingPlaceholder";

export const listItemHeight = 73;
export const miniChartThreshold = 900;
export const miniMarketCapThreshold = 1100;

const TableCellBaseStyled = styled((props: FlexBoxProps & { disabled?: boolean }) => (
  <Flex alignItems="center" {...props} />
))<{
  disabled?: boolean;
}>`
  padding-left: 5px;
  padding-right: 5px;
  cursor: ${p => (p.disabled ? "default" : "pointer")};
`;

export const TableCellBase: React.ComponentType<FlexBoxProps & { disabled?: boolean }> =
  TableCellBaseStyled;

const TableRowBase = styled((props: FlexBoxProps & { header?: boolean; disabled?: boolean }) => (
  <Flex
    flexDirection="row"
    alignItems="stretch"
    justifyContent="flex-start"
    height={listItemHeight}
    py={3}
    {...props}
  />
))<{ header?: boolean; disabled?: boolean }>`
  line-height: 16px;
  ${p =>
    p.header
      ? `
    color: ${p.theme.colors.neutral.c80};
    font-size: 12px;
    padding-right: 12px;
  `
      : `
    color: ${p.theme.colors.neutral.c100};
    font-size: 13px;
    border-bottom: 1px solid ${p.theme.colors.neutral.c40};

    &:hover {
      background:  ${p.theme.colors.neutral.c20};
    }
    &:active {
      background: ${p.theme.colors.neutral.c30};
    }
  `}

  cursor: ${p => (p.disabled ? "default" : "pointer")};

  ${TableCellBaseStyled}:nth-child(1) {
    flex: 0 0 40px;
    justify-content: flex-start;
    padding-left: 5px;
  }
  ${TableCellBaseStyled}:nth-child(2) {
    flex: 1 0 230px;
    justify-content: flex-start;
  }
  ${TableCellBaseStyled}:nth-child(3) {
    flex: 1 0 80px;
    justify-content: flex-end;
  }
  ${TableCellBaseStyled}:nth-child(4) {
    flex: 1 0 30px;
    justify-content: flex-end;
  }
  ${TableCellBaseStyled}:nth-child(5) {
    flex: 1 0 90px;
    justify-content: flex-end;
  }
  ${TableCellBaseStyled}:nth-child(6) {
    flex: 1 0 70px;
    justify-content: flex-end;
  }

  ${TableCellBaseStyled}:nth-child(7) {
    flex: 0 0 40px;
    justify-content: flex-end;
    padding-right: 5px;
    svg {
      fill: currentColor;
    }
  }

  @media (max-width: ${miniChartThreshold}px) {
    ${TableCellBaseStyled}:nth-child(6) {
      display: none;
    }
  }

  @media (max-width: ${miniMarketCapThreshold}px) {
    ${TableCellBaseStyled}:nth-child(3) {
      flex: inherit;
    }
    ${TableCellBaseStyled}:nth-child(1), ${TableCellBaseStyled}:nth-child(5) {
      display: none;
    }
  }
`;

export const TableRow: React.ComponentType<
  FlexBoxProps & { header?: boolean; disabled?: boolean }
> = TableRowBase;

type TableCellProps = {
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
} & React.ComponentProps<typeof TableCellBase>;

export const TableCell = ({ loading, children, ...props }: TableCellProps) => (
  <TableCellBase {...props}>
    {loading ? <LoadingPlaceholder style={{ borderRadius: 50, overflow: "hidden" }} /> : children}
  </TableCellBase>
);

export const TablePlaceholder = ({ size }: { size: number }) => (
  <TableRow disabled>
    {Array.from({ length: size }).map((_, index) => (
      <TableCell key={index} loading />
    ))}
  </TableRow>
);
