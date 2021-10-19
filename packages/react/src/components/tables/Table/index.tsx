import React, { memo, useMemo } from "react";
import styled from "styled-components";
import {
  space,
  color,
  border,
  flexbox,
  SpaceProps,
  ColorProps,
  BorderProps,
  FlexboxProps,
  gridColumn,
  GridColumnProps,
} from "styled-system";
import Grid, { Props as GridProps } from "../../layout/Grid";
import type { Column } from "./Columns";
export type { Column };

export interface ContainerExtraProps extends SpaceProps, ColorProps, BorderProps, FlexboxProps {}
export interface ContainerProps extends ContainerExtraProps, GridProps {}
export const Container = styled(Grid)<ContainerExtraProps>`
  ${space}
  ${color}
  ${border}
  ${flexbox}
`;

export const ExtraRowContainer = styled.div<GridColumnProps>`
  ${gridColumn}
`;

export interface Props<T> extends Omit<ContainerProps, "columns" | "color"> {
  // Table data.
  data: T[];
  // Columns used to render table cells and headers.
  columns: Column<T>[];
  // Renders headers if set to true.
  withHeaders?: boolean;
  // An optional rendering function that will get called after each row render.
  // Can be used to display additional rows and columns dynamically.
  extraRender?: (elt: T, index: number) => React.ReactNode;
}

export interface RowProps<T> {
  data: T[];
  columns: Column<T>[];
  render?: (args: {
    column: Column<T>;
    rowIndex: number;
    columnIndex: number;
    children: React.ReactNode;
  }) => React.ReactNode;
  extraRender?: (elt: T, index: number) => React.ReactNode;
}

function RowsComponent<T>({ data, columns, extraRender, render }: RowProps<T>): JSX.Element {
  return (
    <React.Fragment key="row-component">
      {data.map((elt, rowIndex) => (
        <React.Fragment key={`row-component-row-${rowIndex}`}>
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
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}
export const Rows = memo(RowsComponent) as typeof RowsComponent;

function Table<T>({
  data,
  columns,
  withHeaders,
  extraRender,
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
      <Rows data={data} columns={columns} extraRender={extraRender} />
    </Container>
  );
}

export default memo(Table) as typeof Table;
