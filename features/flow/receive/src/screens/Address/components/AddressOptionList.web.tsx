import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { UserCheck, UserLock } from "@ledgerhq/lumen-ui-react/symbols";
import type { ReceiveAddressOptionId, ReceiveAddressViewProps } from "../../../types";

const OPTION_ICON: Readonly<Record<ReceiveAddressOptionId, typeof UserCheck>> = {
  transparent: UserCheck,
  shielded: UserLock,
};

type Props = Pick<ReceiveAddressViewProps, "addressOptions" | "onSelectAddressOption">;

/** "Select address" step: one row per address type. */
export function AddressOptionList({ addressOptions, onSelectAddressOption }: Props) {
  return (
    <div className="-mx-8 flex flex-col" data-testid="receive-address-options">
      {addressOptions.map(option => (
        <ListItem
          key={option.id}
          density="expanded"
          onClick={() => onSelectAddressOption(option.id)}
          data-testid={`receive-address-option-${option.id}`}
        >
          <ListItemLeading>
            <Spot icon={OPTION_ICON[option.id]} size={48} />
            <ListItemContent>
              <ListItemTitle>{option.label}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      ))}
    </div>
  );
}
