import React from "react";
import {
  TableCellContentTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import type { DelegationCell } from "../components/AccountDelegations/AccountDelegations.types";
import { cellTooltip, displayCell } from "./display";

type Props = Readonly<{ cell: DelegationCell | undefined; discreet: boolean }>;

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
