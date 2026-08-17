import React from "react";
import {
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  DepositOptionCard,
  DepositOptionIcon,
} from "./DepositOptionParts";
import type { DepositOption, DepositOptionId } from "../../types";

type DepositOptionRowProps = Readonly<{
  option: DepositOption;
  onSelect: (id: DepositOptionId) => void;
}>;

export function DepositOptionRow({ option, onSelect }: DepositOptionRowProps) {
  return (
    <DepositOptionCard optionId={option.id} onSelect={onSelect}>
      <CardHeader>
        <CardLeading>
          <DepositOptionIcon optionId={option.id} />
          <CardContent>
            <CardContentTitle>{option.title}</CardContentTitle>
            <CardContentDescription>{option.description}</CardContentDescription>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </DepositOptionCard>
  );
}
