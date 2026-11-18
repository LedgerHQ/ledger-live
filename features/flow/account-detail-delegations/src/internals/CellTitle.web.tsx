import React from "react";
import {
  TableCellContentTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import type { DelegationCell } from "../components/AccountDelegations/AccountDelegations.types";
import { displayCell } from "./display";

type Props = Readonly<{ cell: DelegationCell | undefined; discreet: boolean }>;

const cellTooltip = (cell: DelegationCell | undefined, discreet: boolean) =>
  discreet && cell?.sensitive ? undefined : cell?.tooltip;

export const CellTitle = ({ cell, discreet }: Props) => {
  const value = displayCell(cell, discreet);
  const tooltip = cellTooltip(cell, discreet);
  if (!tooltip) return <TableCellContentTitle>{value}</TableCellContentTitle>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <TableCellContentTitle tabIndex={0}>{value}</TableCellContentTitle>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};
