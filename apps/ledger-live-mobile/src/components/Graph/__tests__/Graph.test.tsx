import React from "react";
import { Path } from "react-native-svg";
import { render } from "@tests/test-renderer";
import Graph from "..";

const defaultProps = {
  width: 100,
  height: 50,
  color: "#000",
  isInteractive: false,
  mapValue: (item: { value: number }) => item.value,
};

describe("Graph", () => {
  it("does not render paths when fewer than two safe points are available", () => {
    const { UNSAFE_queryAllByType } = render(
      <Graph
        {...defaultProps}
        data={[
          { date: new Date("2024-01-01T00:00:00.000Z"), value: 1 },
          { date: undefined, value: 2 },
          { date: new Date("2024-01-03T00:00:00.000Z"), value: Number.NaN },
        ]}
      />,
    );

    expect(UNSAFE_queryAllByType(Path)).toHaveLength(0);
  });

  it("renders area and line paths for safe data", () => {
    const { UNSAFE_queryAllByType } = render(
      <Graph
        {...defaultProps}
        data={[
          { date: new Date("2024-01-01T00:00:00.000Z"), value: 1 },
          { date: new Date("2024-01-02T00:00:00.000Z"), value: 2 },
        ]}
      />,
    );

    expect(UNSAFE_queryAllByType(Path)).toHaveLength(2);
  });
});
