import { render } from "@testing-library/react";
import { ResultToast } from "./ResultToast";

describe("ResultToast (web)", () => {
  it("should render nothing, because the web panel reports no action results", () => {
    const { container } = render(<ResultToast />);

    expect(container).toBeEmptyDOMElement();
  });
});
