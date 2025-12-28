import React from "react";
import { render, screen } from "@tests/test-renderer";
import ExpiryDurationInput from "./ExpiryDurationInput";

describe("ExpiryDurationInput", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all duration options", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />);

    // Check all options are rendered
    expect(screen.getByTestId(`expiry-duration-option-${3 * 60 * 60}`)).toBeOnTheScreen();
    expect(screen.getByTestId(`expiry-duration-option-${6 * 60 * 60}`)).toBeOnTheScreen();
    expect(screen.getByTestId(`expiry-duration-option-${24 * 60 * 60}`)).toBeOnTheScreen();
    expect(screen.getByTestId(`expiry-duration-option-${7 * 24 * 60 * 60}`)).toBeOnTheScreen();
    expect(screen.getByTestId(`expiry-duration-option-${30 * 24 * 60 * 60}`)).toBeOnTheScreen();
  });

  it("should render label text", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />);

    expect(screen.getByText("Expiry duration")).toBeOnTheScreen();
  });

  it("should have 1 day selected by default", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />);

    // The default is 24 * 60 * 60 (1 day)
    const oneDayOption = screen.getByTestId(`expiry-duration-option-${24 * 60 * 60}`);
    expect(oneDayOption).toBeOnTheScreen();
    expect(screen.getByText("1 day")).toBeOnTheScreen();
  });

  it("should call onChange with correct patch when 3 hours is selected", async () => {
    const { user } = render(
      <ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />,
    );

    const threeHoursSeconds = 3 * 60 * 60;
    const threeHoursOption = screen.getByTestId(`expiry-duration-option-${threeHoursSeconds}`);

    await user.press(threeHoursOption);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith({
      value: threeHoursSeconds,
      patch: expect.any(Function),
    });

    // Verify the patch function works correctly
    const { patch } = mockOnChange.mock.calls[0][0];
    const mockTx = { family: "canton", amount: 100 };
    expect(patch(mockTx)).toEqual({
      family: "canton",
      amount: 100,
      expireInSeconds: threeHoursSeconds,
    });
  });

  it("should call onChange with correct patch when 6 hours is selected", async () => {
    const { user } = render(
      <ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />,
    );

    const sixHoursSeconds = 6 * 60 * 60;
    const sixHoursOption = screen.getByTestId(`expiry-duration-option-${sixHoursSeconds}`);

    await user.press(sixHoursOption);

    expect(mockOnChange).toHaveBeenCalledWith({
      value: sixHoursSeconds,
      patch: expect.any(Function),
    });
  });

  it("should call onChange with correct patch when 1 week is selected", async () => {
    const { user } = render(
      <ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />,
    );

    const oneWeekSeconds = 7 * 24 * 60 * 60;
    const oneWeekOption = screen.getByTestId(`expiry-duration-option-${oneWeekSeconds}`);

    await user.press(oneWeekOption);

    expect(mockOnChange).toHaveBeenCalledWith({
      value: oneWeekSeconds,
      patch: expect.any(Function),
    });
  });

  it("should call onChange with correct patch when 1 month is selected", async () => {
    const { user } = render(
      <ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />,
    );

    const oneMonthSeconds = 30 * 24 * 60 * 60;
    const oneMonthOption = screen.getByTestId(`expiry-duration-option-${oneMonthSeconds}`);

    await user.press(oneMonthOption);

    expect(mockOnChange).toHaveBeenCalledWith({
      value: oneMonthSeconds,
      patch: expect.any(Function),
    });
  });

  it("should render with custom testID", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="custom-test-id" />);

    expect(screen.getByTestId("custom-test-id")).toBeOnTheScreen();
  });
});
