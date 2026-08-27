import React from "react";
import { render, screen } from "@testing-library/react";
import Lottie from "react-lottie";
import { Animation } from "./Animation.web";

jest.mock("react-lottie", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="lottie" />),
}));

const mockedLottie = jest.mocked(Lottie);

function lastOptions() {
  return mockedLottie.mock.calls.at(-1)?.[0]?.options;
}

// Typed off globalThis, mirroring Animation.web.tsx: this package deliberately avoids Node types.
function processEnv(): Record<string, string | undefined> {
  const { process } = globalThis as { process?: { env?: Record<string, string | undefined> } };
  if (!process?.env) throw new Error("expected a process env to be available under jsdom");
  return process.env;
}

describe("Animation (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete processEnv().PLAYWRIGHT_RUN;
  });

  it("renders nothing when there is no animation", () => {
    render(<Animation animation={undefined} />);

    expect(screen.queryByTestId("lottie")).toBeNull();
    expect(mockedLottie).not.toHaveBeenCalled();
  });

  it("plays the animation by default", () => {
    render(<Animation animation={{ v: "5" }} />);

    expect(screen.getByTestId("lottie")).toBeInTheDocument();
    expect(lastOptions()).toEqual(expect.objectContaining({ autoplay: true, loop: true }));
  });

  it("does not autoplay under Playwright, so e2e runs stay deterministic", () => {
    processEnv().PLAYWRIGHT_RUN = "true";

    render(<Animation animation={{ v: "5" }} />);

    expect(lastOptions()).toEqual(expect.objectContaining({ autoplay: false }));
  });

  it("honours an explicit autoplay opt-out", () => {
    render(<Animation animation={{ v: "5" }} autoplay={false} />);

    expect(lastOptions()).toEqual(expect.objectContaining({ autoplay: false }));
  });
});
