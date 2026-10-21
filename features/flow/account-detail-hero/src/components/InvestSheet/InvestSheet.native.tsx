import React, { type ComponentType } from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
  type IconProps,
} from "@ledgerhq/lumen-ui-rnative";
import { Chart5, Minus, Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { QuickAction, QuickActionId } from "@features/platform-quick-actions";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "@shared/i18n";

const CONTENT_BOTTOM_SPACING = 24;

const ACTION_ICONS = {
  buy: Plus,
  sell: Minus,
  earn: Chart5,
} satisfies Partial<Record<QuickActionId, ComponentType<IconProps>>>;

type InvestActionId = keyof typeof ACTION_ICONS;

const isInvestAction = (id: QuickActionId): id is InvestActionId => id in ACTION_ICONS;

type Props = Readonly<{
  isOpen: boolean;
  actions: readonly QuickAction[];
  onActionPress: (id: QuickActionId) => void;
  onClose: () => void;
  testID?: string;
}>;

function InvestSheetContent({ actions, onActionPress, testID }: Omit<Props, "isOpen" | "onClose">) {
  const { t } = useTranslation();
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}>
      <BottomSheetHeader />
      {actions.map(({ id, state }) => {
        if (!isInvestAction(id)) return null;
        return (
          <ListItem
            key={id}
            onPress={() => onActionPress(id)}
            disabled={state === "inactive"}
            testID={testID ? `${testID}-${id}` : undefined}
          >
            <ListItemLeading>
              <Spot icon={ACTION_ICONS[id]} />
              <ListItemContent>
                <ListItemTitle>{t(`accountDetailHero.actions.${id}`)}</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        );
      })}
    </BottomSheetView>
  );
}

export function InvestSheet({ isOpen, actions, onActionPress, onClose, testID }: Props) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      contentHasBottomSpace
      testID={testID}
    >
      <InvestSheetContent actions={actions} onActionPress={onActionPress} testID={testID} />
    </QueuedBottomSheet>
  );
}
