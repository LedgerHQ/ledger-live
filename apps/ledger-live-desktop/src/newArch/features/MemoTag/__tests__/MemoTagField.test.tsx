/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "tests/testUtils";
import MemoTagField from "../components/MemoTagField";

describe("MemoTagField", () => {
  it("renders MemoTagField with label and text field", () => {
    render(<MemoTagField showLabel={true} />);
    expect(screen.getByText(/Tag \/ Memo/gi)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Tag \/ Memo/gi)).toBeInTheDocument();
  });

  it("should render MemoTagField without label", () => {
    render(<MemoTagField showLabel={false} />);
    expect(screen.queryByText(/Tag \/ Memo/gi)).not.toBeInTheDocument();
  });

  it("should call onChange when input value changes", () => {
    const handleChange = jest.fn();
    render(<MemoTagField onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter Tag \/ Memo/gi), {
      target: { value: "new memo" },
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("should render CaracterCountComponent if provided", () => {
    const CaracterCountComponent = () => <div>Character Count</div>;
    render(<MemoTagField CaracterCountComponent={CaracterCountComponent} />);
    expect(screen.getByText("Character Count")).toBeInTheDocument();
  });

  it("should render instruction text on autoFocus", () => {
    render(<MemoTagField autoFocus />);
    expect(screen.getByPlaceholderText(/Enter Tag \/ Memo/gi)).toHaveFocus();
    expect(
      screen.getByText(
        /Copy and paste the Tag\/Memo provided by the exchange or custodial wallet./gi,
      ),
    ).toBeInTheDocument();
  });

  it("should render with error", () => {
    render(<MemoTagField error={new Error("Error message")} />);
    expect(screen.getByTestId("input-error")).toBeInTheDocument();
  });

  it("should render with custom placeholder", () => {
    render(<MemoTagField placeholder="Custom Placeholder" />);
    expect(screen.getByPlaceholderText("Custom Placeholder")).toBeInTheDocument();
  });

  it("should render with custom label", () => {
    render(<MemoTagField label="Custom Label" />);
    expect(screen.getByText("Custom Label")).toBeInTheDocument();
  });
});
