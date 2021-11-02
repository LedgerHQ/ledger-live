import React, { useState } from "react";
import { useTheme } from "styled-components";

import { ExpandButton } from "../cta/Button";
import FlexBox from "../layout/Flex";
import Text from "../asorted/Text";
import Table, { ExtraRowContainer, Rows, Column, Props } from "./index";
import { balance, BalanceElement, accounts, Account } from "./stories.helper";

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
        component:
          "This is a flexible component that allow us to create any type of table we can imagine. The examples you see here were created to demonstrate how flexible is the component.",
      },
    },
  },
};

export function Default(args: Props<BalanceElement>): JSX.Element {
  return (
    <>
      <Table
        {...args}
        data={balance.data}
        columns={balance.columns}
        gridRowGap={8}
        gridColumnGap={6}
        borderRadius={8}
        backgroundColor="palette.neutral.c20"
        p={8}
      />
    </>
  );
}

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
              <FlexBox alignItems="center" justifyContent="flex-end">
                <div
                  style={{
                    width: "1px",
                    height: "2em",
                    marginRight: `${theme.space[6]}px`,
                    borderLeft: `1px solid ${theme.colors.palette.neutral.c40}`,
                  }}
                />
                {children}
              </FlexBox>
            ) : (
              children
            )
          }
        />
      )}
      <ExtraRowContainer gridColumn="1 / -1">
        <FlexBox justifyContent="center" mt={-8}>
          <ExpandButton onToggle={setExpanded}>
            <Text variant={"paragraph"}>
              {expanded ? "Hide" : "Show"} tokens ({subAccounts.length})
            </Text>
          </ExpandButton>
        </FlexBox>
      </ExtraRowContainer>
    </>
  );
}

export function Nested(args: Props<Account>): JSX.Element {
  return (
    <>
      <Table
        {...args}
        data={accounts.data}
        columns={accounts.columns}
        gridRowGap={8}
        gridColumnGap={6}
        p={8}
        borderRadius={8}
        backgroundColor="palette.neutral.c20"
        extraRender={(account) =>
          account.subAccounts &&
          account.subAccounts.length > 0 && (
            <SubAccounts account={account} columns={accounts.columns} />
          )
        }
      />
    </>
  );
}
