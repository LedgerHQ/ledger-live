import React, { useState, useCallback } from "react";
import styled, { useTheme } from "styled-components";

import Button from "../cta/Button";
import Flex from "../layout/Flex";
import Text from "../asorted/Text";
import Table, { RowContainerProps, Rows, Column, Props } from "./index";
import { balance, BalanceElement, accounts, Account } from "./stories.helper";
import { StoryTemplate } from "../helpers";

const description = `
### A flexible table component.

Define columns and pass some data to the component that will render it appropriately.

## Usage

\`\`\`js

import { Table } from "@ledgerhq/react-ui"

\`\`\`

### Define columns

To use the Table component the first thing to do is to define an array of columns.

A column is an object that specifies:

- how cells are rendered
- how the header is rendered
- the cells layout

<details>
<summary>Column object shape</summary>
\`\`\`ts
// Note for typescript users, these types are importable from "@ledgerhq/react-ui/components/Table/Columns"
// <T> is the type the data that will be rendered by the table.

interface Column<T> {
  /**
   * A function called to render each cell of the column.
   */
  render: (props: CellProps<T>) => React.ReactNode;
  /**
   * A valid grid template [value](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns#values).
   * This layout is applied to every cell of the column.
   * Default to "min-content" - the largest minimal content contribution of the grid item.
   */
  layout?: string;
  /**
   * A function called to render the header cell.
   * If omitted the rendered header element will be an empty div.
   */
  header?: () => React.ReactNode;
}

interface CellProps<T> {
  /**
   * The cell element.
   */
  elt: T;
  /**
   * The row index.
   */
  rowIndex: number;
  /**
   * The column index.
   */
  columnIndex: number;
}
\`\`\`
</details>

You can either define custom columns or reuse predefined ones that take care of the style
and the layout and match the global look and feel.

<details>
<summary>Predefined columns</summary>
\`\`\`tsx
Table.Columns.text(args: {
  /**
   * An optional title.
   */
  title?: (elt: T) => React.ReactNode;
  /**
   * An optional subtitle.
   */
  subtitle?: (elt: T) => React.ReactNode;
  /**
   * An optional render function to display the column header.
   */
  header?: () => React.ReactNode;
  /**
   * The grid column layout, by default "auto".
   */
  layout?: string;
  /**
   * Optional extra props passed to the title <Text /> wrapper.
   */
  titleProps?: (elt: T) => Partial<React.ComponentProps<typeof Text>>;
  /**
   * Optional extra props passed to the subtitle <Text /> wrapper.
   */
  subtitleProps?: (elt: T) => Partial<React.ComponentProps<typeof Text>>;
})

Table.Columns.icon(args: {
  /**
   * An object containing the unerlying <Text /> wrapper props as well as
   * the "name" and "weight" props of the unerlying <Icon />.
   */
  props: (elt: T) => Pick<IconProps, "name" | "weight"> & TextProps;
  /**
   * An optional render function to display the column header.
   */
  header?: () => React.ReactNode;
  /**
   * The grid column layout, by default "min-content".
   */
  layout?: string;
})
\`\`\`
</details>

\`\`\`tsx
const columns = [
  // Custom column. (layout is optional)
  {
    layout: "64px",
    render: ({ elt }) => <div>elt.value</div>
  },
  // Predefined columns.
  Table.Columns.text({
    layout: "2fr",
    title: (elt) => elt.name,
    subtitle: (elt) => elt.currency.name,
  }),
  Table.Columns.icon({
    props: (elt) => ({
      name: elt.synchronized ? "CircledCheck" : "Clock",
      color: elt.synchronized ? "success.c50" : "neutral.c80",
    }),
  }),
]
\`\`\`

### Minimal Working Example

\`\`\`tsx
// An array of 12 items - each mapped to a row in the table.
const data = new Array(12).fill(0).map((_, idx) => ({
  value: idx,
}));

// We have 4 columns here.
const NB_OF_COLUMNS = 4;
const columns: Column<typeof data[0]>[] = Array(NB_OF_COLUMNS)
  .fill(0)
  .map((_, idx) => ({
    // The header will be a letter based on the column (A / B / C / D).
    // 65 is the char code for the letter 'A'.
    header: () => <Text variant="h5">{String.fromCharCode(65 + idx)}</Text>,
    // Each cell will contain an incremental number as well as the cell position.
    render: ({ elt, rowIndex, columnIndex }) => (
      <Flex alignItems="baseline">
        <Text mr={4}>{elt.value * NB_OF_COLUMNS + columnIndex}</Text>
        <Text variant="extraSmall">
          ({rowIndex} / {columnIndex})
        </Text>
      </Flex>
    ),
  }));

function MinimalExample(args) {
  return <Table {...args} data={data} columns={columns} />;
};
\`\`\`
`;

/* Default minimal example */

// An array of 12 items - each mapped to a row in the table.
const data = new Array(12).fill(0).map((_, idx) => ({
  value: idx,
}));

// We have 4 columns here.
const NB_OF_COLUMNS = 4;
const columns: Column<(typeof data)[0]>[] = Array(NB_OF_COLUMNS)
  .fill(0)
  .map((_, idx) => ({
    // The header will be a letter based on the column (A / B / C / D).
    // 65 is the char code for the letter 'A'.
    header: () => <Text variant="h5">{String.fromCharCode(65 + idx)}</Text>,
    // Each cell will contain an incremental number as well as the cell position.
    render: ({ elt, rowIndex, columnIndex }) => (
      <Flex alignItems="baseline">
        <Text mr={4}>{elt.value * NB_OF_COLUMNS + columnIndex}</Text>
        <Text variant="extraSmall">
          ({rowIndex} / {columnIndex})
        </Text>
      </Flex>
    ),
  }));

export const Default: StoryTemplate<Props<(typeof data)[0]>> = args => {
  return <Table {...args} data={data} columns={columns} />;
};

/* Styled example */

const styledExampleDescription = `
A more advanced example that applies some styles to the table and uses predefined columns.

Additional props passed to the Table are applied to the outer container which is
an instance of the \`Grid\` component.

In this example we are taking advantage of that by using the \`p\`, \`gridRowGap\`, \`gridColumnGap\`,
\`borderRadius\` and \`backgroundColor\` props to style the table container.
`;

export const Styled: StoryTemplate<Props<BalanceElement>> = args => {
  return (
    <>
      <Table
        {...args}
        data={balance.data}
        columns={balance.columns}
        p={8}
        gridRowGap={8}
        gridColumnGap={6}
        borderRadius={8}
        backgroundColor="neutral.c20"
      />
    </>
  );
};

Styled.parameters = {
  docs: {
    description: {
      story: styledExampleDescription,
    },
  },
};

/* Nested example */

const nestedExampleDescription = `
A complex example that takes in entry nested data and conditonally adds a custom additional row to the table.

The data has the following shape:

\`\`\`ts
type Account = {
  name: string;
  currency: { name: string; abbrev: string };
  synchronized: boolean;
  amount: number;
  evolution: number;
  starred: boolean;
  // The interesting thing is that an account can contain sub-accounts
  subAccounts?: Account[];
};
\`\`\`

The table used in this example adds an extra row containing a nested table when an account contains sub-accounts.

In order to achieve that the \`extraRender\` prop is used and set to a function that will render the extra row.

You can use the \`ExtraRowContainer\` wrapper as the row container if you want the extra content to span the entire row.
Otherwise be careful not to disturb the grid layout order.

\`\`\`tsx
<Table
  /* ... */
  extraRender={(account) =>
    // If there are sub accounts…
    account.subAccounts &&
    account.subAccounts.length > 0 && (
      // …render the extra row.
      // ExtraRowContainer is a component that will span to the whole row.
      <Table.ExtraRowContainer>{/* stuff */}</Table.ExtraRowContainer>
    )
  }
/>
\`\`\`

`;

function SubAccounts({
  account,
  columns,
}: {
  account: Account;
  columns: Column<Account>[];
}): JSX.Element | null {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { subAccounts } = account;
  if (!subAccounts) return null;

  return (
    <>
      {expanded && (
        <Rows
          data={subAccounts}
          columns={columns}
          render={({ columnIndex, children }) =>
            columnIndex === 0 ? (
              <Flex alignItems="center" justifyContent="flex-end">
                <div
                  style={{
                    width: "1px",
                    height: "2em",
                    marginRight: `${theme.space[6]}px`,
                    borderLeft: `1px solid ${theme.colors.neutral.c40}`,
                  }}
                />
                {children}
              </Flex>
            ) : (
              children
            )
          }
        />
      )}
      <Table.ExtraRowContainer>
        <Flex justifyContent="center" mt={-8}>
          <Button.Expand onToggle={setExpanded}>
            <Text variant={"paragraph"}>
              {expanded ? "Hide" : "Show"} tokens ({subAccounts.length})
            </Text>
          </Button.Expand>
        </Flex>
      </Table.ExtraRowContainer>
    </>
  );
}

export function Nested(args: Props<Account>): JSX.Element {
  return (
    <Table
      {...args}
      data={accounts.data}
      columns={accounts.columns}
      gridRowGap={8}
      gridColumnGap={6}
      p={8}
      borderRadius={8}
      backgroundColor="neutral.c20"
      extraRender={account =>
        account.subAccounts &&
        account.subAccounts.length > 0 && (
          <SubAccounts account={account} columns={accounts.columns} />
        )
      }
    />
  );
}

Nested.parameters = {
  docs: {
    description: {
      story: nestedExampleDescription,
    },
  },
};

/* Custom row example */

const customRowExampleDescription = `
This example showcases how to styles rows, wrap them inside custom containers and add event handlers.

#### Row containers and event handlers

The \`renderRow\` prop is a render function that allows to customize the jsx output for each row of the table.

Note that the container should have the [\`display: contents\`](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Relationship_of_Grid_Layout#grid_and_display_contents) css rule
in order to preserve the table grid layout order.

\`\`\`tsx
const renderRow = React.useCallback(
  (rowIndex, children) => (
    // RowContainer is a convenience component having "display: contents" hardcoded.
    // You can pass any event handler here.
    <Table.RowContainer onClick={() => alert(rowIndex)}>
      {children}
    </Table.RowContainer>
  ),
  [],
);

<Table
  /* ... */
  renderRow={renderRow}
/>
\`\`\`

#### Styling

Styling the container itself will not work.
Since it has the \`display: contents\` rule the element will not produce a content box.

One working solution is to style the children instead.

\`\`\`ts
const CustomRowContainer = styled(Table.RowContainer).attrs(
  ({ onClick }) => ({
    onClick,
  }),
)\`
  & > * {
    padding-left: \${(p) => p.theme.space[5]}px;
    padding-right: \${(p) => p.theme.space[5]}px;
    padding-top: \${(p) => p.theme.space[5]}px;
    padding-bottom: \${(p) => p.theme.space[5]}px;

    &:first-child {
      padding-left: \${(p) => p.theme.space[8]}px;
    }
    &:last-child {
      padding-right: \${(p) => p.theme.space[8]}px;
    }
  }

  &:hover > * {
    transition: background-color 0.2s;
    cursor: pointer;
    background-color: \${(p) =>
      p.rowIndex % 2 === 0
        ? p.theme.colors.neutral.c30
        : p.theme.colors.primary.c20};
  }
\`;
\`\`\`
`;

const CustomRowContainer = styled(Table.RowContainer).attrs<{ onClick: () => void }>(
  ({ onClick }) => ({
    onClick,
  }),
)<RowContainerProps>`
  & > * {
    padding-left: ${p => p.theme.space[5]}px;
    padding-right: ${p => p.theme.space[5]}px;
    padding-top: ${p => p.theme.space[5]}px;
    padding-bottom: ${p => p.theme.space[5]}px;

    &:first-child {
      padding-left: ${p => p.theme.space[8]}px;
    }
    &:last-child {
      padding-right: ${p => p.theme.space[8]}px;
    }
  }

  &:hover > * {
    transition: background-color 0.2s;
    cursor: pointer;
    background-color: ${p =>
      p.rowIndex % 2 === 0 ? p.theme.colors.neutral.c30 : p.theme.colors.primary.c20};
  }
`;

export const CustomRows: StoryTemplate<Props<BalanceElement>> = args => {
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | undefined>();

  const renderRow = useCallback(
    (rowIndex: number, children?: React.ReactNode) => (
      <CustomRowContainer rowIndex={rowIndex} onClick={() => setSelectedRowIndex(rowIndex)}>
        {children}
      </CustomRowContainer>
    ),
    [],
  );

  return (
    <>
      <Flex mb={8}>
        <Text variant="h5">Selected index: {selectedRowIndex ?? "none"}</Text>
      </Flex>
      <Table
        {...args}
        data={balance.data}
        columns={balance.columns}
        renderRow={renderRow}
        borderRadius={8}
        justifyItems="stretch"
        alignItems="stretch"
        border="1px solid"
        borderColor="neutral.c50"
        overflow="hidden"
        withHeaders={false}
      />
    </>
  );
};

CustomRows.parameters = {
  docs: {
    description: {
      story: customRowExampleDescription,
    },
  },
};

/* Export */

export default {
  title: "Tables/Table",
  component: Table,
  argTypes: {
    withHeaders: { type: "boolean", defaultValue: false },
    data: { control: false },
    columns: { control: false },
    rows: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
};
