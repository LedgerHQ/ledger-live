import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { buildMoreRows, buildMoreViewProps } from "../../More/fixtures";
import { MoreScene } from "./MoreScene";

describe("MoreScene (native)", () => {
  it("should render the four rows in the design order", () => {
    render(<MoreScene viewModel={buildMoreViewProps()} />);

    expect(screen.getAllByTestId(/^more-row-/).map(row => row.props.testID)).toEqual([
      "more-row-managePin",
      "more-row-accessBaanx",
      "more-row-help",
      "more-row-logout",
    ]);
  });

  it("should call only the pressed row's handler", async () => {
    const user = userEvent.setup();
    const logout = jest.fn();
    const managePin = jest.fn();
    render(
      <MoreScene
        viewModel={buildMoreViewProps({
          rows: buildMoreRows({ logout, managePin }),
        })}
      />,
    );

    await user.press(screen.getByTestId("more-row-logout"));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(managePin).not.toHaveBeenCalled();
  });
});
