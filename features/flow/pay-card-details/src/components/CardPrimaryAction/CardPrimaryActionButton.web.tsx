import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

export type CardPrimaryActionButtonProps = Readonly<{
  label: string;
  onPress: () => void;
}>;

export function CardPrimaryActionButton({ label, onPress }: CardPrimaryActionButtonProps) {
  return (
    <Button appearance="base" size="md" isFull onClick={onPress} aria-label={label}>
      {label}
    </Button>
  );
}
