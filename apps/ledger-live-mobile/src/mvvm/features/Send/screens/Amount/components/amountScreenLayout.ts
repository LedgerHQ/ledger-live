export type AmountScreenStackHeights = Readonly<{
  availableHeight: number;
  amountHeight: number;
  feesHeight: number;
  quickActionsHeight: number;
}>;

export type AmountScreenCompactSavings = Readonly<{
  keyboard: number;
  amount: number;
}>;

export type AmountScreenStackLayout = Readonly<{
  compact: boolean;
  scrollEnabled: boolean;
  pinQuickActions: boolean;
}>;

type ResolveAmountScreenStackParams = Readonly<{
  requestedQuickActions: boolean;
  heights: AmountScreenStackHeights;
  compact: boolean;
  compactSavings: AmountScreenCompactSavings;
}>;

const UNMEASURED_LAYOUT: AmountScreenStackLayout = {
  compact: false,
  scrollEnabled: false,
  pinQuickActions: false,
};

export function resolveAmountScreenStack({
  requestedQuickActions,
  heights,
  compact,
  compactSavings,
}: ResolveAmountScreenStackParams): AmountScreenStackLayout {
  const { availableHeight, amountHeight, feesHeight, quickActionsHeight } = heights;
  const hasStackMeasure = availableHeight > 0 && amountHeight > 0 && feesHeight > 0;
  if (!hasStackMeasure) {
    return UNMEASURED_LAYOUT;
  }

  const waitsForQuickActions = requestedQuickActions && quickActionsHeight === 0;
  const visibleQuickActionsHeight = requestedQuickActions ? quickActionsHeight : 0;
  const regularAvailableHeight = availableHeight - (compact ? compactSavings.keyboard : 0);
  const regularAmountHeight = amountHeight + (compact ? compactSavings.amount : 0);
  const nextCompact =
    !waitsForQuickActions &&
    regularAmountHeight + feesHeight + visibleQuickActionsHeight > regularAvailableHeight;

  const nextAvailableHeight = regularAvailableHeight + (nextCompact ? compactSavings.keyboard : 0);
  const contentHeight =
    regularAmountHeight - (nextCompact ? compactSavings.amount : 0) + feesHeight;
  const pinQuickActions =
    requestedQuickActions &&
    quickActionsHeight > 0 &&
    contentHeight + quickActionsHeight > nextAvailableHeight;

  return {
    compact: nextCompact,
    scrollEnabled: pinQuickActions || contentHeight > nextAvailableHeight,
    pinQuickActions,
  };
}
