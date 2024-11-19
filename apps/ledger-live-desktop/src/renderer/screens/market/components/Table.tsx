import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import styled, { StyledComponent, DefaultTheme } from "styled-components";
import { FlexProps } from "styled-system";
import LoadingPlaceholder from "~/renderer/components/LoadingPlaceholder";

export const listItemHeight = 73;
export const miniChartThreshold = 900;
export const miniMarketCapThreshold = 1100;

export const TableCellBase: StyledComponent<"div", DefaultTheme, FlexProps> = styled(Flex).attrs({
  alignItems: "center",
})<{ disabled?: boolean }>`
  padding-left: 5px;
  padding-right: 5px;
  cursor: ${p => (p.disabled ? "default" : "pointer")};
`;

export const TableRow: StyledComponent<
  "div",
  DefaultTheme,
  FlexProps & { header?: boolean; disabled?: boolean }
> = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "stretch",
  justifyContent: "flex-start",
  height: listItemHeight,
  py: 3,
})<{ header?: boolean; disabled?: boolean }>`
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

    :hover {
      background:  ${p.theme.colors.neutral.c20};
    }
    :active {
      background: ${p.theme.colors.neutral.c30};
    }
  `}

  cursor: ${p => (p.disabled ? "default" : "pointer")};

  ${TableCellBase}:nth-child(1) {
    flex: 0 0 40px;
    justify-content: flex-start;
    padding-left: 5px;
  }
  ${TableCellBase}:nth-child(2) {
    flex: 1 0 230px;
    justify-content: flex-start;
  }
  ${TableCellBase}:nth-child(3) {
    flex: 1 0 80px;
    justify-content: flex-end;
  }
  ${TableCellBase}:nth-child(4) {
    flex: 1 0 30px;
    justify-content: flex-end;
  }
  ${TableCellBase}:nth-child(5) {
    flex: 1 0 90px;
    justify-content: flex-end;
  }
  ${TableCellBase}:nth-child(6) {
    flex: 1 0 70px;
    justify-content: flex-end;
  }

  ${TableCellBase}:nth-child(7) {
    flex: 0 0 40px;
    justify-content: flex-end;
    padding-right: 5px;
    svg {
      fill: currentColor;
    }
  }

  @media (max-width: ${miniChartThreshold}px) {
    ${TableCellBase}:nth-child(6) {
      display: none;
    }
  }

  @media (max-width: ${miniMarketCapThreshold}px) {
    ${TableCellBase}:nth-child(3) {
      flex: inherit;
    }
    ${TableCellBase}:nth-child(1), ${TableCellBase}:nth-child(5) {
      display: none;
    }
  }
`;

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
