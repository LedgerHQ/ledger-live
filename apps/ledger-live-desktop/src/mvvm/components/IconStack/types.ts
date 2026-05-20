import type React from "react";

export type IconStackLayoutProps = {
  readonly children?: React.ReactNode;
  readonly size: number;
  readonly overlap?: number;
  readonly borderWidth?: number;
  readonly borderColor?: string;
  readonly borderRadius?: number | string;
  readonly testID?: string;
  readonly className?: string;
} & Omit<React.ComponentPropsWithoutRef<"div">, "children" | "className">;

export type IconStackItemsProps<T> = IconStackLayoutProps & {
  readonly items: readonly T[];
  readonly maxVisible?: number;
  readonly maxOverflowDisplay?: number;
  readonly renderItem: (item: T) => React.ReactNode;
  readonly getItemKey: (item: T) => string;
  readonly getTooltipContent: (items: readonly T[]) => string;
  readonly overflowTestID?: string;
};

export type IconStackItemsViewModelParams<T> = Omit<
  IconStackItemsProps<T>,
  "renderItem" | "getItemKey"
>;

export type IconStackProps<T> = IconStackItemsProps<T>;
