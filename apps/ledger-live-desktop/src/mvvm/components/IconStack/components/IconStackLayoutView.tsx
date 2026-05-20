import React, { forwardRef, useMemo } from "react";
import { cn } from "LLD/utils/cn";
import type { IconStackLayoutProps } from "../types";
import type { useIconStackLayoutViewModel } from "../hooks/useIconStackLayoutViewModel";

type IconStackLayoutStyles = ReturnType<typeof useIconStackLayoutViewModel>;

type IconStackLayoutViewProps = IconStackLayoutProps & {
  readonly layoutStyles: IconStackLayoutStyles;
};

export const IconStackLayoutView = forwardRef<HTMLDivElement, IconStackLayoutViewProps>(
  function IconStackLayoutView({ children, testID, className, layoutStyles, ...rest }, ref) {
    const { borderWidth, resolvedOverlap, resolvedBorderRadius, resolvedBorderColor, wrapperSize } =
      layoutStyles;

    const wrappedChildren = useMemo(
      () =>
        React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null;
          return (
            <div
              key={child.key}
              className="box-border shrink-0 overflow-hidden"
              style={{
                width: wrapperSize,
                height: wrapperSize,
                marginLeft: index > 0 ? -resolvedOverlap : 0,
                borderWidth,
                borderStyle: "solid",
                borderColor: resolvedBorderColor,
                borderRadius: resolvedBorderRadius,
                zIndex: index,
              }}
            >
              {child}
            </div>
          );
        }),
      [
        children,
        wrapperSize,
        resolvedOverlap,
        borderWidth,
        resolvedBorderColor,
        resolvedBorderRadius,
      ],
    );

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center", className)}
        data-testid={testID}
        {...rest}
      >
        {wrappedChildren}
      </div>
    );
  },
);
