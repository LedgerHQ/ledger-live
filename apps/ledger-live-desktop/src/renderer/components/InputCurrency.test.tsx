import React, { useState } from "react";
import { BigNumber } from "bignumber.js";
import { render, screen } from "tests/testSetup";
import InputCurrency from "./InputCurrency";

// Ethereum's "Gwei" fee unit — magnitude 9, i.e. at most 9 decimals.
const gweiUnit = { name: "Gwei", code: "Gwei", magnitude: 9 };

// Babylon-like unit (magnitude 6) for the percentage-preset scenarios.
const babyUnit = { name: "Baby", code: "BABY", magnitude: 6 };

// Mirrors the cosmos Amount field: presets live in renderRight and set the
// amount directly (an external change), which flows back in as the value prop.
function PresetHarness({ delegated }: { delegated: BigNumber }) {
  const [value, setValue] = useState<BigNumber>(delegated);
  const presets = [
    { label: "25%", value: delegated.multipliedBy(0.25).integerValue() },
    { label: "50%", value: delegated.multipliedBy(0.5).integerValue() },
    { label: "100%", value: delegated },
  ];
  return (
    <InputCurrency
      unit={babyUnit}
      value={value}
      onChange={setValue}
      renderRight={presets.map(p => (
        <button key={p.label} type="button" onClick={() => setValue(p.value)}>
          {p.label}
        </button>
      ))}
    />
  );
}

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

describe("InputCurrency — percentage presets (LIVE-34511)", () => {
  it("applies a preset on the first tap, with no typing", async () => {
    const { user } = render(<PresetHarness delegated={new BigNumber("4500000")} />); // 4.5 BABY
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("4.5");

    await user.click(screen.getByText("25%"));

    // 25% of 4.5 = 1.125, applied immediately — not only on a second tap.
    expect(input.value).toBe("1.125");
  });

  it("lets a preset override a value the user has already typed", async () => {
    const { user } = render(<PresetHarness delegated={new BigNumber("4500000")} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    await user.clear(input);
    await user.type(input, "2");
    expect(input.value).toBe("2");

    await user.click(screen.getByText("50%"));

    // 50% of 4.5 = 2.25 must replace the typed "2".
    expect(input.value).toBe("2.25");
  });

  it("preserves the in-progress edit when the value prop is only the echo of typing", async () => {
    const { user } = render(<PresetHarness delegated={new BigNumber("4500000")} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    await user.clear(input);
    await user.type(input, "1.2");

    // No external change happened — the field must show exactly what was typed.
    expect(input.value).toBe("1.2");
  });
});
