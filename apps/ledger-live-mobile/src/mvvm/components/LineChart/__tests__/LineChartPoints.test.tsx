import React from "react";
import { G } from "react-native-svg";
import { render } from "@tests/test-renderer";
import { LineChartPoints } from "../LineChartPoints";
import type { LineChartPointMarker } from "../types";

let points: Array<Record<string, unknown>>;
let scrubberPosition: number | undefined;

jest.mock("@ledgerhq/lumen-ui-rnative/visualization", () => ({
  Point: (props: Record<string, unknown>) => {
    points.push(props);
    return null;
  },
  useScrubberContext: () => ({ scrubberPosition }),
}));

const renderPoints = (markers: LineChartPointMarker[], scrubbedIndex?: number) => {
  points = [];
  scrubberPosition = scrubbedIndex;
  return render(<LineChartPoints points={markers} formatValue={v => `$${v}`} lastIndex={10} />);
};

describe("LineChartPoints", () => {
  it("renders nothing when there are no points", () => {
    expect(renderPoints([]).toJSON()).toBeNull();
    expect(points).toHaveLength(0);
  });

  it("uses the formatted value and top position as defaults", () => {
    renderPoints([{ index: 1, value: 99 }]);
    expect(points[0]).toMatchObject({
      dataX: 1,
      dataY: 99,
      label: "$99",
      labelPosition: "top",
      color: undefined,
    });
  });

  it("forwards explicit marker options and resolves named colors", () => {
    renderPoints([
      { index: 0, value: 1, label: "Peak", labelPosition: "bottom", hidePoint: true },
      { index: 1, value: 2, color: "success" },
      { index: 2, value: 3, color: "#abc" },
    ]);
    expect(points[0]).toMatchObject({ label: "Peak", labelPosition: "bottom", hidePoint: true });
    expect(typeof points[1].color).toBe("string");
    expect(points[2].color).toBe("#abc");
  });

  it("omits the label when hideLabel is set, even if a label is provided", () => {
    renderPoints([{ index: 1, value: 99, label: "Peak", hideLabel: true }]);
    expect(points[0].label).toBeUndefined();
  });

  it("dims only the top labels right of the scrubbed index, which the overlay misses", () => {
    const { UNSAFE_getAllByType } = renderPoints(
      [
        { index: 1, value: 1 },
        { index: 3, value: 3 },
        { index: 4, value: 4, labelPosition: "bottom" },
        { index: 5, value: 5, hideLabel: true },
      ],
      2,
    );

    expect(UNSAFE_getAllByType(G).map(group => group.props.opacity)).toEqual([
      undefined,
      0.2,
      undefined,
      undefined,
    ]);
  });

  it("dims the max label when the scrubber is on its index", () => {
    const { UNSAFE_getAllByType } = renderPoints([{ index: 0, value: 9 }], 0);

    expect(UNSAFE_getAllByType(G)[0].props.opacity).toBe(0.2);
  });
});
