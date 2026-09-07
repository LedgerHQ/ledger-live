import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import {
  Android,
  Apple,
  Cart,
  CheckmarkCircleFill,
  ChevronRight,
  CreditCardFill,
  Placeholder,
  PlusCircleFill,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import type { CardOnboardingOptionViewProps } from "./useCardOnboardingOptionViewModel";

const STEP_ICONS: Record<string, typeof Placeholder> = {
  "create-account": CheckmarkCircleFill,
  "choose-card-type": CreditCardFill,
  "top-up-card": PlusCircleFill,
  "first-purchase": Cart,
  Apple,
  Android,
};

export function CardOnboardingOptionView({
  id,
  title,
  description,
  status,
  iconId,
  onAction,
}: CardOnboardingOptionViewProps) {
  const Icon = status === "done" ? CheckmarkCircleFill : (STEP_ICONS[iconId] ?? Placeholder);

  return (
    <ListItem
      disabled={status === "pending"}
      onPress={status === "active" ? onAction : undefined}
      testID={`pay-card-onboarding-step-${id}`}
    >
      <ListItemLeading>
        <Icon size={20} color={status === "done" ? "success" : undefined} />
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
