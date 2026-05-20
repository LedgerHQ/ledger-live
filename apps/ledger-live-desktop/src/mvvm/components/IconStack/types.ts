import type React from "react";

export type LayoutProps = {
  readonly children?: React.ReactNode;
  readonly size: number;
  readonly overlap?: number;
  readonly borderWidth?: number;
  readonly borderColor?: string;
  readonly borderRadius?: number | string;
  readonly testID?: string;
  readonly className?: string;
} & Omit<React.ComponentPropsWithoutRef<"div">, "children" | "className">;

export type LayoutStyles = {
  readonly borderWidth: number;
  readonly resolvedOverlap: number;
  readonly resolvedBorderRadius: number | string;
  readonly resolvedBorderColor: string;
  readonly wrapperSize: number;
};

export type IconStackProps<T> = LayoutProps & {
  readonly items: readonly T[];
  readonly maxVisible?: number;
  readonly maxOverflowDisplay?: number;
  readonly renderItem: (item: T) => React.ReactNode;
  readonly getItemKey: (item: T) => string;
  readonly getTooltipContent: (items: readonly T[]) => string;
  readonly overflowTestID?: string;
};

export type IconStackViewModelParams<T> = Omit<IconStackProps<T>, "renderItem" | "getItemKey">;

export type IconStackViewProps<T> = {
  readonly layoutProps: LayoutProps;
  readonly layoutStyles: LayoutStyles;
  readonly visibleItems: readonly T[];
  readonly displayedOverflowCount: number;
  readonly hasOverflowBadge: boolean;
  readonly tooltipContent: string;
  readonly overflowTestID?: string;
  readonly renderItem: (item: T) => React.ReactNode;
  readonly getItemKey: (item: T) => string;
  readonly forwardedRef?: React.ForwardedRef<HTMLDivElement>;
};
