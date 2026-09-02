import { render } from "@testing-library/react";
import { Interaction } from "./Interaction";

describe("Interaction (web)", () => {
  it("renders nothing: the probes ship with the mobile tool first", () => {
    const onBack = jest.fn();
    const { container } = render(<Interaction probes={[]} onBack={onBack} />);

    expect(container).toBeEmptyDOMElement();
    expect(onBack).not.toHaveBeenCalled();
  });
});
