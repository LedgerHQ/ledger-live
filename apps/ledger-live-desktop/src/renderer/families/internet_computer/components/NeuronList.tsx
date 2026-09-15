import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { HeaderWrapper, TableRow } from "~/renderer/components/TableContainer";

export type NeuronColumn = {
  key: string;
  label: React.ReactNode;
  width: string;
  align?: "left" | "center" | "right";
};

type Props = {
  neurons: readonly ICPNeuron[];
  columns: readonly NeuronColumn[];
  renderCell: (neuron: ICPNeuron, columnKey: string) => React.ReactNode;
  onRowClick?: (neuron: ICPNeuron) => void;
  emptyState: React.ReactNode;
};

const ALIGNMENT = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
} as const satisfies Record<NonNullable<NeuronColumn["align"]>, string>;

const Cell = styled(Box)<{ width: string; align: NeuronColumn["align"] }>`
  flex: 0 0 ${p => p.width};
  max-width: ${p => p.width};
  align-items: ${p => ALIGNMENT[p.align ?? "left"]};
  overflow: hidden;
`;

// Rows are only clickable in the manage flow; the refresh flow puts its action in a cell instead.
const Row = styled(TableRow)<{ clickable: boolean }>`
  cursor: ${p => (p.clickable ? "pointer" : "default")};
  &:hover {
    background: ${p => (p.clickable ? undefined : "transparent")};
  }
  // The row takes focus when it is clickable, so it has to show where the focus is.
  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.wallet};
    outline-offset: -2px;
  }
`;

/**
 * Table of an account's neurons, shared by the manage and refresh-voting-power flows. The two need
 * different columns but the same scaffolding, so callers supply the columns and render their own
 * cells.
 */
const NeuronList = ({ neurons, columns, renderCell, onRowClick, emptyState }: Props) => {
  if (neurons.length === 0) return <>{emptyState}</>;

  return (
    <Box>
      <HeaderWrapper>
        {columns.map(column => (
          <Cell key={column.key} width={column.width} align={column.align}>
            <Text ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
              {column.label}
            </Text>
          </Cell>
        ))}
      </HeaderWrapper>
      {neurons.map(neuron => {
        const onSelect = onRowClick ? () => onRowClick(neuron) : undefined;
        return (
          <Row
            key={neuron.id?.toString() ?? neuron.accountIdentifier}
            clickable={!!onSelect}
            onClick={onSelect}
            // Selecting a neuron is the entry point to the whole flow, and the table gives us a
            // styled div, so the row declares the semantics itself rather than being mouse-only.
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={
              onSelect &&
              ((event: React.KeyboardEvent) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                // Space would scroll the step instead of choosing the neuron.
                event.preventDefault();
                onSelect();
              })
            }
            data-testid="icp-neuron-row"
          >
            {columns.map(column => (
              <Cell key={column.key} width={column.width} align={column.align}>
                {renderCell(neuron, column.key)}
              </Cell>
            ))}
          </Row>
        );
      })}
    </Box>
  );
};

export default NeuronList;
