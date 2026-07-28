import React, { useMemo } from "react";
import Svg, { Circle } from "react-native-svg";
import QRCodeLib from "qrcode";

const DOT_SCALE = 0.88;

type ContactAddressDetailDotQrCodeProps = Readonly<{
  value: string;
  size: number;
  color: string;
}>;

function createQrMatrix(value: string): boolean[][] {
  const modules = QRCodeLib.create(value, { errorCorrectionLevel: "M" }).modules;
  const matrixSize = modules.size;
  const matrix: boolean[][] = [];

  for (let row = 0; row < matrixSize; row++) {
    matrix.push(
      Array.from({ length: matrixSize }, (_, column) =>
        Boolean(modules.get(row, column)),
      ),
    );
  }

  return matrix;
}

export function ContactAddressDetailDotQrCode({
  value,
  size,
  color,
}: ContactAddressDetailDotQrCodeProps): React.JSX.Element {
  const circles = useMemo(() => {
    const matrix = createQrMatrix(value);
    const cellSize = size / matrix.length;
    const radius = (cellSize / 2) * DOT_SCALE;

    return matrix.flatMap((row, rowIndex) =>
      row.flatMap((isActive, columnIndex) =>
        isActive
          ? [
              {
                cx: columnIndex * cellSize + cellSize / 2,
                cy: rowIndex * cellSize + cellSize / 2,
                r: radius,
              },
            ]
          : [],
      ),
    );
  }, [size, value]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {circles.map((circle, index) => (
        <Circle
          key={`${circle.cx}-${circle.cy}-${index}`}
          cx={circle.cx}
          cy={circle.cy}
          r={circle.r}
          fill={color}
        />
      ))}
    </Svg>
  );
}
