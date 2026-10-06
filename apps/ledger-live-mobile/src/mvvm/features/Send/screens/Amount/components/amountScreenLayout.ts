export type AmountScreenStackHeights = Readonly<{
  viewportHeight: number;
  amountHeight: number;
  feesHeight: number;
  quickActionsHeight: number;
}>;

export type AmountScreenStackLayout = Readonly<{
  scrollEnabled: boolean;
}>;

type ResolveAmountScreenStackParams = Readonly<{
  requestedQuickActions: boolean;
  heights: AmountScreenStackHeights;
}>;

export function resolveAmountScreenStack({
  requestedQuickActions,
  heights,
}: ResolveAmountScreenStackParams): AmountScreenStackLayout {
  const { viewportHeight, amountHeight, feesHeight, quickActionsHeight } = heights;
  const hasStackMeasure = viewportHeight > 0 && amountHeight > 0 && feesHeight > 0;
  const quickActionsContribute =
    requestedQuickActions && quickActionsHeight > 0 ? quickActionsHeight : 0;
  const stackedHeight = amountHeight + feesHeight + quickActionsContribute;

  return {
    scrollEnabled: hasStackMeasure && stackedHeight > viewportHeight,
  };
}
