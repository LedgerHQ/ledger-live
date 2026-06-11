import React from "react";
import { render } from "@tests/test-renderer";
import { LineChartPoints } from "../LineChartPoints";
import type { LineChartPointMarker } from "../types";

let points: Array<Record<string, unknown>>;

jest.mock("@ledgerhq/lumen-ui-rnative-visualization", () => ({
  Point: (props: Record<string, unknown>) => {
    points.push(props);
    return null;
  },
}));

const renderPoints = (markers: LineChartPointMarker[]) => {
  points = [];
  return render(<LineChartPoints points={markers} formatValue={v => `$${v}`} />);
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
});
