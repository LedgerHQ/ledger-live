import React from "react";
import {
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableCellContent,
  TableCellContentDescription,
  TableCellContentTitle,
  TableCellItem,
  TableCol,
  TableColGroup,
  TableHeader,
  TableHeaderCell,
  TableHeaderRow,
  TableRoot,
  TableRow,
} from "@ledgerhq/lumen-ui-react";
import type {
  DelegationColumn,
  DelegationRow,
} from "../components/AccountDelegations/AccountDelegations.types";
import { displayCell, initialOf } from "./display";
import { RowActionsMenu } from "./RowActionsMenu";
import { StatusTag } from "./StatusTag";

const DEFAULT_ALIGN = "end";

type Props = Readonly<{
  validatorColumnLabel: string;
  statusColumnLabel?: string;
  columns: readonly DelegationColumn[];
  rows: readonly DelegationRow[];
  discreet: boolean;
  rowActionsLabel?: string;
  onOpenValidator?: (rowId: string) => void;
  onSelectRowAction: (rowId: string, actionId: string) => void;
}>;

export const DelegationsTable = ({
  validatorColumnLabel,
  statusColumnLabel,
  columns,
  rows,
  discreet,
  rowActionsLabel,
  onOpenValidator,
  onSelectRowAction,
}: Props) => {
  const hasActions = rows.some(({ actions }) => actions.length > 0);

  return (
    <TableRoot appearance="plain">
      <Table>
        <TableColGroup>
          <TableCol />
          {statusColumnLabel ? <TableCol /> : null}
          {columns.map(({ id }) => (
            <TableCol key={id} />
          ))}
          {hasActions ? <TableCol className="w-80" /> : null}
        </TableColGroup>
        <TableHeader>
          <TableHeaderRow>
            <TableHeaderCell>{validatorColumnLabel}</TableHeaderCell>
            {statusColumnLabel ? <TableHeaderCell>{statusColumnLabel}</TableHeaderCell> : null}
            {columns.map(({ id, label, align = DEFAULT_ALIGN }) => (
              <TableHeaderCell key={id} align={align}>
                {label}
              </TableHeaderCell>
            ))}
            {hasActions ? <TableHeaderCell align="end" aria-label={rowActionsLabel} /> : null}
          </TableHeaderRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ id, validator, status, cells, actions }) => (
            <TableRow
              key={id}
              clickable={onOpenValidator !== undefined}
              tabIndex={onOpenValidator ? 0 : undefined}
              onClick={() => onOpenValidator?.(id)}
              onKeyDown={event => {
                if (event.target === event.currentTarget && event.key === "Enter") {
                  onOpenValidator?.(id);
                }
              }}
              data-testid={`delegation-row-${id}`}
            >
              <TableCell>
                <TableCellItem>
                  <Avatar
                    size="md"
                    className="shrink-0"
                    src={validator.imageUrl}
                    alt=""
                    fallbackText={initialOf(validator.name)}
                  />
                  <TableCellContent>
                    <TableCellContentTitle>{validator.name}</TableCellContentTitle>
                    {validator.description ? (
                      <TableCellContentDescription>
                        {validator.description}
                      </TableCellContentDescription>
                    ) : null}
                  </TableCellContent>
                </TableCellItem>
              </TableCell>
              {statusColumnLabel ? (
                <TableCell>{status ? <StatusTag status={status} /> : null}</TableCell>
              ) : null}
              {columns.map(({ id: columnId, align = DEFAULT_ALIGN }) => {
                const cell = cells[columnId];
                return (
                  <TableCell key={columnId} align={align}>
                    <TableCellItem align={align}>
                      <TableCellContent>
                        <TableCellContentTitle>{displayCell(cell, discreet)}</TableCellContentTitle>
                      </TableCellContent>
                    </TableCellItem>
                  </TableCell>
                );
              })}
              {hasActions ? (
                <TableCell align="end" onClick={event => event.stopPropagation()}>
                  {actions.length > 0 ? (
                    <RowActionsMenu
                      rowId={id}
                      actions={actions}
                      label={rowActionsLabel ?? validator.name}
                      onSelect={onSelectRowAction}
                    />
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableRoot>
  );
};
