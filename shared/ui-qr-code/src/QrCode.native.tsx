import React, { useMemo } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import Svg, { Circle, Rect } from "react-native-svg";
import { createStyledQrCode, FINDER_MODULES } from "./styledQrCode";
import type { QrCodeProps } from "./types";

const DEFAULT_QR_CODE_SIZE = 200;
const FOREGROUND_COLOR = "#FFFFFF";

export function QrCode({
  value,
  size = DEFAULT_QR_CODE_SIZE,
  foregroundColor = FOREGROUND_COLOR,
  centerContent,
  testID,
}: QrCodeProps): React.JSX.Element {
  const hasCenterContent = centerContent !== undefined;
  const styledQrCode = useMemo(
    () => createStyledQrCode(value, size, hasCenterContent),
    [value, size, hasCenterContent],
  );

  return (
    <Box
      testID={testID}
      lx={{
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        lx={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {styledQrCode.dots.map(({ cx, cy, radius }, index) => (
            <Circle key={index} cx={cx} cy={cy} r={radius} fill={foregroundColor} />
          ))}
          {styledQrCode.finders.map(({ x, y, moduleSize }) => {
            const outer = FINDER_MODULES * moduleSize;

            return (
              <React.Fragment key={`${x}-${y}`}>
                <Rect
                  x={x + moduleSize / 2}
                  y={y + moduleSize / 2}
                  width={outer - moduleSize}
                  height={outer - moduleSize}
                  rx={moduleSize * 2}
                  fill="none"
                  stroke={foregroundColor}
                  strokeWidth={moduleSize}
                />
                <Rect
                  x={x + moduleSize * 2}
                  y={y + moduleSize * 2}
                  width={moduleSize * 3}
                  height={moduleSize * 3}
                  rx={moduleSize}
                  fill={foregroundColor}
                />
              </React.Fragment>
            );
          })}
        </Svg>
        {hasCenterContent ? (
          <Box
            lx={{
              position: "absolute",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {centerContent}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
