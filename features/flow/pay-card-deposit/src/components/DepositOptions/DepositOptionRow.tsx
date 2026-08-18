import React from "react";
import {
  DepositOptionIcon,
  DepositOptionListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "./DepositOptionParts";
import type { DepositOption, DepositOptionId } from "../../types";

type DepositOptionRowProps = Readonly<{
  option: DepositOption;
  onSelect: (id: DepositOptionId) => void;
}>;

export function DepositOptionRow({ option, onSelect }: DepositOptionRowProps) {
  return (
    <DepositOptionListItem optionId={option.id} onSelect={onSelect}>
      <ListItemLeading>
        <DepositOptionIcon optionId={option.id} />
        <ListItemContent>
          <ListItemTitle>{option.title}</ListItemTitle>
          <ListItemDescription>{option.description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </DepositOptionListItem>
  );
}
