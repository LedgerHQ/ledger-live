import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { UserCheck, UserLock } from "@ledgerhq/lumen-ui-react/symbols";
import type { ReceiveAddressOptionId } from "../../../logic/toReceiveAddressOptions";
import type { AddressOptionListProps } from "./AddressOptionList.types";

const OPTION_ICON: Readonly<Record<ReceiveAddressOptionId, typeof UserCheck>> = {
  transparent: UserCheck,
  shielded: UserLock,
};

export function AddressOptionList({ options, onSelect }: AddressOptionListProps) {
  return (
    <div className="-mx-8 flex flex-col" data-testid="receive-address-options">
      {options.map(option => (
        <ListItem
          key={option.id}
          density="expanded"
          onClick={() => onSelect(option.id)}
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
