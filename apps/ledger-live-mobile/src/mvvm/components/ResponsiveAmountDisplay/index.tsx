import React, { useCallback, useEffect, useState } from "react";
import { useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { AmountDisplay } from "@ledgerhq/lumen-ui-rnative";
import type { AmountDisplayProps, AmountDisplaySize } from "@ledgerhq/lumen-ui-rnative";

/** Horizontal space reserved on both sides, matching the hero's `paddingHorizontal: s16`. */
const DEFAULT_HORIZONTAL_INSET = 32;

type Props = Omit<AmountDisplayProps, "size"> & {
  /**
   * Horizontal space (in px) reserved on both sides when comparing the rendered
   * amount width against the screen width. Defaults to the hero's `s16 * 2`.
   */
  horizontalInset?: number;
};

/**
 * Drop-in replacement for Lumen's `AmountDisplay` that downgrades the size from
 * `md` to `sm` when the rendered amount would overflow the screen width. This
 * prevents large balances (e.g. high-value countervalues such as Lebanese pound)
 * from being truncated, since `AmountDisplay` has no shrink/wrap behaviour.
 */
export function ResponsiveAmountDisplay({
  formatter,
  horizontalInset = DEFAULT_HORIZONTAL_INSET,
  onLayout,
  ...amountProps
}: Readonly<Props>) {
  const { width } = useWindowDimensions();
  const availableWidth = width - horizontalInset;

  const [size, setSize] = useState<AmountDisplaySize>("md");

  // A different currency or locale produces a differently sized amount, so
  // re-evaluate from the largest size. Plain value updates keep the current size
  // (downgrade is one-way) to avoid md/sm flicker on every balance refresh.
  useEffect(() => {
    setSize("md");
  }, [formatter]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (size === "md" && event.nativeEvent.layout.width > availableWidth) {
        setSize("sm");
      }
      onLayout?.(event);
    },
    [size, availableWidth, onLayout],
  );

  return (
    <AmountDisplay {...amountProps} formatter={formatter} size={size} onLayout={handleLayout} />
  );
}
