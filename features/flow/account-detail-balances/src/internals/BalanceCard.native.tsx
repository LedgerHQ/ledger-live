import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentRow,
  CardContentTitle,
  CardHeader,
  CardLeading,
} from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { BalanceItem } from "../components/AccountBalances/AccountBalances.types";
import { displayValue } from "./displayValue";

type Props = Readonly<{
  item: BalanceItem;
  discreet: boolean;
  onShowDescription: (itemId: string) => void;
  testID?: string;
}>;

export const BalanceCard = ({ item, discreet, onShowDescription, testID }: Props) => (
  <Card
    type={item.description ? "interactive" : "info"}
    onPress={item.description ? () => onShowDescription(item.id) : undefined}
    testID={testID}
  >
    <CardHeader>
      <CardLeading>
        <CardContent>
          <CardContentRow lx={{ gap: "s4" }}>
            <CardContentDescription>{item.label}</CardContentDescription>
            {item.description ? <Information size={16} color="muted" /> : null}
          </CardContentRow>
          <CardContentRow lx={{ gap: "s4" }}>
            <CardContentTitle>{displayValue(item, discreet)}</CardContentTitle>
          </CardContentRow>
        </CardContent>
      </CardLeading>
    </CardHeader>
  </Card>
);
