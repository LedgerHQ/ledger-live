import React, { type ComponentType } from "react";
import { Button, type IconProps } from "@ledgerhq/lumen-ui-react";
import { ArrowDown, ArrowUp, Chart5, Minus, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { QuickAction, QuickActionId } from "@features/platform-quick-actions";
import { useTranslation } from "@shared/i18n";

const ACTION_ICONS = {
  receive: ArrowDown,
  send: ArrowUp,
  buy: Plus,
  sell: Minus,
  earn: Chart5,
} satisfies Partial<Record<QuickActionId, ComponentType<IconProps>>>;

type DesktopActionId = keyof typeof ACTION_ICONS;

const isDesktopAction = (id: QuickActionId): id is DesktopActionId => id in ACTION_ICONS;

type Props = Readonly<{
  actions: readonly QuickAction[];
  onActionPress: (id: QuickActionId) => void;
  testID?: string;
}>;

export function AccountActions({ actions, onActionPress, testID }: Props) {
  const { t } = useTranslation();
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-8" data-testid={testID}>
      {actions.map(({ id, state }) => {
        if (!isDesktopAction(id)) return null;
        return (
          <Button
            key={id}
            appearance={id === "receive" ? "base" : "gray"}
            size="sm"
            icon={ACTION_ICONS[id]}
            onClick={() => onActionPress(id)}
            disabled={state === "inactive"}
            className="rounded-full"
            data-testid={testID ? `${testID}-${id}` : undefined}
          >
            {t(`accountDetailHero.actions.${id}`)}
          </Button>
        );
      })}
    </div>
  );
}
