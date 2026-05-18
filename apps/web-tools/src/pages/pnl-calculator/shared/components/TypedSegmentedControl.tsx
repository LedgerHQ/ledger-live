import type { ReactNode } from "react";
import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";

type TypedSegmentedControlProps<T extends string> = Readonly<{
  values: readonly T[];
  selected: T;
  onSelect: (next: T) => void;
  renderLabel: (value: T) => ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  tabLayout?: "fixed" | "fit";
  className?: string;
}>;

/**
 * Strongly-typed wrapper around `SegmentedControl`. The `onSelect` callback
 * always receives a value from `values`, so consumers never need an `as` cast
 * on the string value returned by the underlying primitive.
 */
export function TypedSegmentedControl<T extends string>({
  values,
  selected,
  onSelect,
  renderLabel,
  ariaLabel,
  ariaLabelledBy,
  tabLayout = "fixed",
  className = "w-full",
}: TypedSegmentedControlProps<T>) {
  return (
    <SegmentedControl
      selectedValue={selected}
      onSelectedChange={raw => {
        const next = values.find(v => v === raw);
        if (next) onSelect(next);
      }}
      tabLayout={tabLayout}
      className={className}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {values.map(value => (
        <SegmentedControlButton key={value} value={value}>
          {renderLabel(value)}
        </SegmentedControlButton>
      ))}
    </SegmentedControl>
  );
}
