import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import {
  Cart,
  CheckmarkCircleFill,
  ChevronRight,
  CreditCardFill,
  Placeholder,
  PlusCircleFill,
} from "@ledgerhq/lumen-ui-react/symbols";
import type { CardOnboardingOptionViewProps } from "./useCardOnboardingOptionViewModel";

const STEP_ICONS: Record<string, typeof Placeholder> = {
  "create-account": CheckmarkCircleFill,
  "choose-card-type": CreditCardFill,
  "top-up-card": PlusCircleFill,
  "first-purchase": Cart,
  "apple-google-pay": Placeholder,
};

export function CardOnboardingOptionView({
  title,
  description,
  status,
  iconId,
  onAction,
}: CardOnboardingOptionViewProps) {
  const Icon = status === "done" ? CheckmarkCircleFill : (STEP_ICONS[iconId] ?? Placeholder);

  return (
    <ListItem disabled={status === "pending"} onClick={status === "active" ? onAction : undefined}>
      <ListItemLeading>
        <Icon size={20} className={status === "done" ? "text-success" : undefined} />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription>{description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      {status === "active" && (
        <ListItemTrailing>
          <ChevronRight size={16} />
        </ListItemTrailing>
      )}
    </ListItem>
  );
}
