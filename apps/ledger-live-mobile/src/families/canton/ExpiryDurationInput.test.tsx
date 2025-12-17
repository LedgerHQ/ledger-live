import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ExpiryDurationInput from "./ExpiryDurationInput";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@react-navigation/native", () => ({
  useTheme: () => ({
    colors: {
      primary: "#0000ff",
      card: "#ffffff",
      border: "#cccccc",
      white: "#ffffff",
      text: "#000000",
    },
  }),
}));

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

    expect(screen.getByText("canton.expiryDuration.label")).toBeOnTheScreen();
  });

  it("should have 1 day selected by default", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />);

    // The default is 24 * 60 * 60 (1 day)
    const oneDayOption = screen.getByTestId(`expiry-duration-option-${24 * 60 * 60}`);
    expect(oneDayOption).toBeOnTheScreen();
    // Verify it shows the translated label
    expect(screen.getByText("canton.expiryDuration.oneDay")).toBeOnTheScreen();
  });

  it("should call onChange with correct patch when 3 hours is selected", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />);

    const threeHoursSeconds = 3 * 60 * 60;
    const threeHoursOption = screen.getByTestId(`expiry-duration-option-${threeHoursSeconds}`);

    fireEvent.press(threeHoursOption);

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

  it("should call onChange with correct patch when 6 hours is selected", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />);

    const sixHoursSeconds = 6 * 60 * 60;
    const sixHoursOption = screen.getByTestId(`expiry-duration-option-${sixHoursSeconds}`);

    fireEvent.press(sixHoursOption);

    expect(mockOnChange).toHaveBeenCalledWith({
      value: sixHoursSeconds,
      patch: expect.any(Function),
    });
  });

  it("should call onChange with correct patch when 1 week is selected", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />);

    const oneWeekSeconds = 7 * 24 * 60 * 60;
    const oneWeekOption = screen.getByTestId(`expiry-duration-option-${oneWeekSeconds}`);

    fireEvent.press(oneWeekOption);

    expect(mockOnChange).toHaveBeenCalledWith({
      value: oneWeekSeconds,
      patch: expect.any(Function),
    });
  });

  it("should call onChange with correct patch when 1 month is selected", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />);

    const oneMonthSeconds = 30 * 24 * 60 * 60;
    const oneMonthOption = screen.getByTestId(`expiry-duration-option-${oneMonthSeconds}`);

    fireEvent.press(oneMonthOption);

    expect(mockOnChange).toHaveBeenCalledWith({
      value: oneMonthSeconds,
      patch: expect.any(Function),
    });
  });

  it("should update selection when different option is pressed", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="expiry-duration" />);

    // First select 3 hours
    const threeHoursOption = screen.getByTestId(`expiry-duration-option-${3 * 60 * 60}`);
    fireEvent.press(threeHoursOption);

    expect(mockOnChange).toHaveBeenCalledTimes(1);

    // Then select 1 week
    const oneWeekOption = screen.getByTestId(`expiry-duration-option-${7 * 24 * 60 * 60}`);
    fireEvent.press(oneWeekOption);

    expect(mockOnChange).toHaveBeenCalledTimes(2);
  });

  it("should render with custom testID", () => {
    render(<ExpiryDurationInput onChange={mockOnChange} testID="custom-test-id" />);

    expect(screen.getByTestId("custom-test-id")).toBeOnTheScreen();
  });
});
