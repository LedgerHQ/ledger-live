import useTheme from "~/renderer/hooks/useTheme";

type UseIconStackLayoutViewModelParams = {
  readonly size: number;
  readonly overlap?: number;
  readonly borderWidth?: number;
  readonly borderColor?: string;
  readonly borderRadius?: number | string;
};

export function useIconStackLayoutViewModel({
  size,
  overlap,
  borderWidth = 2,
  borderColor,
  borderRadius,
}: UseIconStackLayoutViewModelParams) {
  const theme = useTheme();
  const resolvedOverlap = overlap ?? Math.round(size * 0.25);
  const resolvedBorderRadius = borderRadius ?? Math.round(size * 0.25) + borderWidth;
  const resolvedBorderColor = borderColor ?? theme.colors.background.card;
  const wrapperSize = size + borderWidth * 2;

  return {
    borderWidth,
    resolvedOverlap,
    resolvedBorderRadius,
    resolvedBorderColor,
    wrapperSize,
  };
}

export type IconStackLayoutStyles = ReturnType<typeof useIconStackLayoutViewModel>;
