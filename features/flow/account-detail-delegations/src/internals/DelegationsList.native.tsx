import React from "react";
import {
  Avatar,
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type {
  DelegationColumn,
  DelegationRow,
} from "../components/AccountDelegations/AccountDelegations.types";
import { displayCell, initialOf } from "./display";
import { TAG_APPEARANCE } from "./tagAppearance";

type Props = Readonly<{
  columns: readonly DelegationColumn[];
  rows: readonly DelegationRow[];
  discreet: boolean;
  onSelectRow: (rowId: string) => void;
}>;

export const DelegationsList = ({ columns, rows, discreet, onSelectRow }: Props) => {
  const [mainColumn] = columns;

  return (
    <Box lx={{ marginHorizontal: "-s8" }}>
      {rows.map(({ id, validator, status, cells }) => {
        const main = mainColumn ? cells[mainColumn.id] : undefined;

        return (
          <ListItem key={id} onPress={() => onSelectRow(id)} testID={`delegation-row-${id}`}>
            <ListItemLeading>
              <Avatar size="md" src={validator.imageUrl} fallbackText={initialOf(validator.name)} />
              <ListItemContent>
                <ListItemTitle>{validator.name}</ListItemTitle>
                {validator.description ? (
                  <ListItemDescription>{validator.description}</ListItemDescription>
                ) : null}
                {status ? (
                  <Box lx={{ flexDirection: "row" }}>
                    <Tag
                      size="sm"
                      label={status.label}
                      appearance={TAG_APPEARANCE[status.appearance]}
                    />
                  </Box>
                ) : null}
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
              {main ? (
                <Text
                  typography="body2SemiBold"
                  numberOfLines={1}
                  lx={{ color: "base", flexShrink: 1 }}
                >
                  {displayCell(main, discreet)}
                </Text>
              ) : null}
              <ChevronRight size={16} color="muted" />
            </ListItemTrailing>
          </ListItem>
        );
      })}
    </Box>
  );
};
