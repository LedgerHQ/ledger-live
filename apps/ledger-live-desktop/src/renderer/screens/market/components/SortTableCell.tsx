import { Flex, Icon } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";
import { TableCellBase } from "./Table";

export const SortTableCell = ({
  onClick,
  orderByKey,
  orderBy,
  order,
  children,
  ...props
}: {
  loading?: boolean;
  onClick?: (key: string) => void;
  orderByKey: string;
  orderBy?: string | undefined;
  order?: string | undefined;
  children?: React.ReactNode;
}) => (
  <TableCellBase onClick={() => !!onClick && onClick(orderByKey)} {...props}>
    {children}
    <ChevronContainer m={2} show={orderBy === orderByKey} orderDirection={order}>
      <Icon name="ChevronBottom" size={10} />
    </ChevronContainer>
  </TableCellBase>
);

const ChevronContainer = styled(Flex).attrs({ m: 1 })<{
  show: boolean;
  orderDirection?: string | undefined;
}>`
  opacity: ${p => (p.show ? 1 : 0)};
  svg {
    transform: rotate(
      ${p => (p.orderDirection ? (p.orderDirection === "asc" ? "180deg" : "0deg") : "90deg")}
    );
    transition: transform 0.3s ease-out;
  }
`;
