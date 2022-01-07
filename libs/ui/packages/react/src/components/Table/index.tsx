import React, { memo, useMemo } from "react";
import styled from "styled-components";
import { border, BorderProps, gridColumn, GridColumnProps } from "styled-system";
import Grid, { Props as GridProps } from "../layout/Grid";
import Flex from "../layout/Flex";
import * as Columns from "./Columns";
import type { Column } from "./Columns";
import { BaseStyledProps } from "../styled";
export type { Column };

export interface ContainerExtraProps extends BorderProps, BaseStyledProps {}
export interface ContainerProps extends ContainerExtraProps, GridProps {}
const Container = styled(Grid)<ContainerExtraProps>`
  ${border}
`;

export const ExtraRowContainer = styled.div.attrs({ gridColumn: "1 / -1" })<GridColumnProps>`
  ${gridColumn}
`;

export type RowContainerProps = { rowIndex: number };
export const RowContainer = styled(Flex)<RowContainerProps>`
  display: contents;
`;

interface CommonProps<T> {
  /** Table data */
  data: T[];
  /** Columns used to render table cells and headers. */
  columns: Column<T>[];
  /**
   * An optional rendering function that will get called after each row render.
   * Can be used to display additional rows and columns dynamically.
   */
  extraRender?: (elt: T, index: number) => React.ReactNode;
  /**
   * A render function that can be used to wrap each row of the table inside an custom element.
   */
  renderRow?: (rowIndex: number, children: React.ReactNode) => React.ReactNode;
}

export interface Props<T> extends CommonProps<T>, Omit<ContainerProps, "columns" | "color"> {
  /**
   * Renders headers if set to true.
   */
  withHeaders?: boolean;
}

export interface RowProps<T> extends CommonProps<T> {
  render?: (args: {
    column: Column<T>;
    rowIndex: number;
    columnIndex: number;
    children: React.ReactNode;
  }) => React.ReactNode;
}

function RowsComponent<T>({
  data,
  columns,
  render,
  extraRender,
  renderRow,
}: RowProps<T>): JSX.Element {
  return (
    <React.Fragment key="row-component">
      {data.map((elt, rowIndex) => {
        const row = (
          <>
            {columns.map((column, columnIndex) => (
              <React.Fragment key={`row-component-column-${rowIndex}${columnIndex}`}>
                {render
                  ? render({
                      column,
                      rowIndex,
                      columnIndex,
                      children: column.render({ elt, rowIndex, columnIndex }),
                    })
                  : column.render({ elt, rowIndex, columnIndex })}
              </React.Fragment>
            ))}
            {(extraRender && extraRender(elt, rowIndex)) || null}
          </>
        );

        if (renderRow) {
          return renderRow(rowIndex, row);
        } else {
          return <React.Fragment key={`row-component-row-${rowIndex}`}>{row}</React.Fragment>;
        }
      })}
    </React.Fragment>
  );
}
export const Rows = memo(RowsComponent) as typeof RowsComponent;

export function Table<T>({
  data,
  columns,
  withHeaders,
  extraRender,
  renderRow,
  ...containerProps
}: Props<T>): JSX.Element {
  const gridTemplateColumns = useMemo(
    () => columns.reduce<string>((acc, col) => `${acc} ${col.layout || "auto"}`, ""),
    [columns],
  );

  const headers = useMemo(
    () =>
      withHeaders
        ? columns.reduce<React.ReactNode[]>(
            (acc, col, index) => [
              ...acc,
              <React.Fragment key={`header-col-${index}`}>
                {col.header ? col.header() : <div />}
              </React.Fragment>,
            ],
            [],
          )
        : null,
    [withHeaders, columns],
  );

  return (
    <Container
      gridTemplateColumns={gridTemplateColumns}
      gridAutoRows="auto"
      columns="none"
      alignItems="center"
      {...containerProps}
    >
      {headers}
      <Rows data={data} columns={columns} extraRender={extraRender} renderRow={renderRow} />
    </Container>
  );
}
Table.Columns = Columns;
Table.ExtraRowContainer = ExtraRowContainer;
Table.RowContainer = RowContainer;

const memoTable = memo(Table) as unknown as typeof Table;
memoTable.Columns = Columns;
memoTable.RowContainer = RowContainer;
memoTable.ExtraRowContainer = ExtraRowContainer;

export default memoTable;
