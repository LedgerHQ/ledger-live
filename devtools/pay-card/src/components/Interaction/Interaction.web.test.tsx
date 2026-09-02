import { render } from "@testing-library/react";
import { Interaction } from "./Interaction";

const details = {
  imageUrl: undefined,
  isFetching: false,
  error: undefined,
  request: jest.fn(),
  clear: jest.fn(),
};

describe("Interaction (web)", () => {
  it("renders nothing: the probes ship with the mobile tool first", () => {
    const onBack = jest.fn();
    const { container } = render(<Interaction probes={[]} details={details} onBack={onBack} />);

    expect(container).toBeEmptyDOMElement();
    expect(onBack).not.toHaveBeenCalled();
    expect(details.request).not.toHaveBeenCalled();
  });
});
