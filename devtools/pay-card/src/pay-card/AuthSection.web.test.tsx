import { render } from "@testing-library/react";
import { AuthSection } from "./AuthSection";

describe("AuthSection (web)", () => {
  it("should render nothing, because the web host keeps no Card session", () => {
    const { container } = render(<AuthSection />);

    expect(container).toBeEmptyDOMElement();
  });
});
