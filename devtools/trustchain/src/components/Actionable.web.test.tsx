import { render, screen } from "@testing-library/react";
import { Actionable } from "./Actionable";

describe("Actionable (web)", () => {
  it("shows a multiline result with its line breaks", () => {
    render(
      <Actionable
        buttonTitle="sdk.decryptUserData"
        inputs={[]}
        action={() => "first\nsecond"}
        value={"first\nsecond"}
        valueDisplay={value => value}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Result" })).toHaveValue("first\nsecond");
  });

  it("shows no result before the action has answered", () => {
    render(
      <Actionable
        buttonTitle="sdk.decryptUserData"
        inputs={[]}
        action={() => "ok"}
        valueDisplay={value => value}
      />,
    );

    expect(screen.queryByRole("textbox", { name: "Result" })).toBeNull();
  });
});
