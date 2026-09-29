import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { CardPrimaryActionButtonProps } from "./types";

export function CardPrimaryActionButton({ label, onPress }: CardPrimaryActionButtonProps) {
  return (
    <Button appearance="base" size="md" isFull onClick={onPress} aria-label={label}>
      {label}
    </Button>
  );
}
