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
import type { ReceiveAddressOptionId, ReceiveAddressViewProps } from "../../../types";

const OPTION_ICON: Readonly<Record<ReceiveAddressOptionId, typeof UserCheck>> = {
  transparent: UserCheck,
  shielded: UserLock,
};

type Props = Pick<ReceiveAddressViewProps, "addressOptions" | "onSelectAddressOption">;

/** "Select address" step: one row per address type. */
export function AddressOptionList({ addressOptions, onSelectAddressOption }: Props) {
  return (
    <Box lx={{ marginHorizontal: "-s8" }} testID="receive-address-options">
      {addressOptions.map(option => (
        <ListItem
          key={option.id}
          density="expanded"
          onPress={() => onSelectAddressOption(option.id)}
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
