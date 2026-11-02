import React from "react";
import {
  Box,
  Button,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { DelegationHeaderAction } from "../components/AccountDelegations/AccountDelegations.types";

type Props = Readonly<{
  title: string;
  actions: readonly DelegationHeaderAction[];
  onSelectAction: (actionId: string) => void;
  testID?: string;
}>;

export const DelegationsHeader = ({ title, actions, onSelectAction, testID }: Props) => (
  <>
    <Subheader>
      <SubheaderRow>
        <SubheaderTitle>{title}</SubheaderTitle>
      </SubheaderRow>
    </Subheader>
    {actions.length > 0 ? (
      <Box lx={{ gap: "s8" }}>
        <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
          {actions.map(({ id, label, disabledReason }) => (
            <Button
              key={id}
              appearance="gray"
              size="sm"
              disabled={disabledReason !== undefined}
              onPress={disabledReason === undefined ? () => onSelectAction(id) : undefined}
              testID={testID ? `${testID}-header-action-${id}` : undefined}
            >
              {label}
            </Button>
          ))}
        </Box>
        {actions.map(({ id, disabledReason }) =>
          disabledReason ? (
            <Text key={id} typography="body3" lx={{ color: "muted" }}>
              {disabledReason}
            </Text>
          ) : null,
        )}
      </Box>
    ) : null}
  </>
);
