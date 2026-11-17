import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { UserCheck, UserLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ReceiveAddressOptionId } from "../../../logic/toReceiveAddressOptions";
import type { AddressOptionListProps } from "./AddressOptionList.types";

const OPTION_ICON: Readonly<Record<ReceiveAddressOptionId, typeof UserCheck>> = {
  transparent: UserCheck,
  shielded: UserLock,
};

/** One row per address the account receives on (Zcash: public, private). */
export function AddressOptionList({ options, onSelect }: AddressOptionListProps) {
  return (
    <Box lx={{ marginHorizontal: "-s8" }} testID="receive-address-options">
      {options.map(option => (
        <ListItem
          key={option.id}
          density="expanded"
          onPress={() => onSelect(option.id)}
          testID={`receive-address-option-${option.id}`}
        >
          <ListItemLeading>
            <Spot icon={OPTION_ICON[option.id]} size={48} />
            <ListItemContent>
              <ListItemTitle>{option.label}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      ))}
    </Box>
  );
}
