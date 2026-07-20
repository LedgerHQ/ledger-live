import React from "react";
import { BigNumber } from "bignumber.js";
import { render, screen } from "tests/testSetup";
import InputCurrency from "./InputCurrency";

// Ethereum's "Gwei" fee unit — magnitude 9, i.e. at most 9 decimals.
const gweiUnit = { name: "Gwei", code: "Gwei", magnitude: 9 };

describe("InputCurrency — caret preservation", () => {
  // Regression: the EVM advanced-fee inputs (Max Priority Fee / Max Fee) are
  // pre-filled by the gas tracker with values that already use all 9 Gwei
  // decimals. Inserting a digit in the middle pushed the string to 10 decimals,
  // sanitizeValueString truncated it, and React reset the caret to the end.
  it("keeps the caret in place when editing a value already at the unit's max decimals", async () => {
    const { user } = render(
      <InputCurrency
        autoFocus
        defaultUnit={gweiUnit}
        value={new BigNumber("3014305248")} // 3.014305248 Gwei
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("3.014305248");

    // Place the caret right after "3." and type a digit.
    await user.type(input, "9", { initialSelectionStart: 2, initialSelectionEnd: 2 });

    // The 10th decimal overflows and is dropped, but the caret must stay right
    // after the just-typed "9" (index 3), not teleport to the end.
    expect(input.value).toBe("3.901430524");
    expect(input.selectionStart).toBe(3);
  });

  it("keeps the caret in place on a normal mid-string edit (no truncation)", async () => {
    const { user } = render(
      <InputCurrency
        autoFocus
        defaultUnit={gweiUnit}
        value={new BigNumber("1200000")} // 0.0012 Gwei — well under 9 decimals
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("0.0012");

    // Insert "5" right after "0.00" (index 4).
    await user.type(input, "5", { initialSelectionStart: 4, initialSelectionEnd: 4 });

    expect(input.value).toBe("0.00512");
    expect(input.selectionStart).toBe(5);
  });

  it("rejects an overflow digit appended at the end and leaves the caret there", async () => {
    const { user } = render(
      <InputCurrency
        autoFocus
        defaultUnit={gweiUnit}
        value={new BigNumber("3014305248")} // 3.014305248 Gwei — already 9 decimals
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("3.014305248");

    // Append a 10th decimal at the very end: it overflows and is dropped.
    await user.type(input, "9", { initialSelectionStart: 11, initialSelectionEnd: 11 });

    expect(input.value).toBe("3.014305248"); // value unchanged
    expect(input.selectionStart).toBe(11); // caret stays at the end, no jump
  });

  it("reflects an external value update when the input is focused but the user has not typed", async () => {
    const firstValue = new BigNumber("1000000000"); // 1 Gwei
    const secondValue = new BigNumber("5000000000"); // 5 Gwei

    const { rerender } = render(
      <InputCurrency defaultUnit={gweiUnit} value={firstValue} onChange={() => {}} />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("1");

    // Simulate the Input container's handleClick focusing the field without the user typing.
    input.focus();

    rerender(<InputCurrency defaultUnit={gweiUnit} value={secondValue} onChange={() => {}} />);

    // The display must update immediately — no second click required.
    expect(input.value).toBe("5");
  });

  it("forwards a ref to the underlying input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(
      <InputCurrency
        ref={ref}
        defaultUnit={gweiUnit}
        value={new BigNumber("1000000000")} // 1 Gwei
        onChange={() => {}}
      />,
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByRole("textbox"));
  });
});
