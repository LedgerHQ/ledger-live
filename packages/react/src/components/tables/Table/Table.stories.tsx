import React, { useState } from "react";
import { ExpandButton } from "@components/cta/Button";
import FlexBox from "@components/layout/Flex";
import Table, { ExtraRowContainer, Rows, Column, Props } from "./index";
import { balance, BalanceElement, accounts, Account } from "./stories.helper";
import Text from "@components/asorted/Text";

export default {
  title: "Tables/Table",
  component: Table,
  argTypes: {
    withHeaders: { type: "boolean", defaultValue: false },
    data: { control: false },
    columns: { control: false },
    rows: { table: { disable: true } },
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
            columnIndex === 0 ? <FlexBox pl={10}>{children}</FlexBox> : children
          }
        />
      )}
      <ExtraRowContainer gridColumn="1 / -1">
        <FlexBox justifyContent="center" mt={-8}>
          <ExpandButton onToggle={setExpanded}>
            <Text fontSize={3}>
              {expanded ? "Hide" : "Show"} token accounts ({subAccounts.length})
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
