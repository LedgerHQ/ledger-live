import { render, screen } from "jest/render.native";
import { Text } from "react-native";
import { Pill } from "./Pill.native";

describe("Pill (native)", () => {
  it("renders string children", () => {
    render(<Pill variant="muted">Beta</Pill>);
    expect(screen.getByText("Beta")).toBeOnTheScreen();
  });

  it("renders numeric children", () => {
    render(<Pill variant="active">{3}</Pill>);
    expect(screen.getByText("3")).toBeOnTheScreen();
  });

  it("renders element children", () => {
    render(
      <Pill variant="success">
        <Text>3 overridden</Text>
      </Pill>,
    );
    expect(screen.getByText("3 overridden")).toBeOnTheScreen();
  });
});
