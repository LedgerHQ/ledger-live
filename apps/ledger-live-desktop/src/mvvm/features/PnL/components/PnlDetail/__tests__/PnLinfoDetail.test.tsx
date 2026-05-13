import React from "react";
import { render, screen } from "tests/testSetup";
import { PnLinfoDetail } from "../PnLinfoDetail";

type PnLinfoDetailProps = React.ComponentProps<typeof PnLinfoDetail>;

const TITLE = "Realised return";
const DESCRIPTION = "Estimated gain or loss on your current holdings.";
const VALUE = "$243.32";
const DISCREET_PLACEHOLDER = "***";

const makeProps = (overrides: Partial<PnLinfoDetailProps> = {}): PnLinfoDetailProps => ({
  title: TITLE,
  description: DESCRIPTION,
  value: VALUE,
  ...overrides,
});

describe("PnLinfoDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the title, the description and the value", () => {
    render(<PnLinfoDetail {...makeProps()} />);

    expect(screen.getByText(TITLE)).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
    expect(screen.getByText(VALUE)).toBeVisible();
  });

  it("should hide the value behind '***' when discreet is enabled", () => {
    render(<PnLinfoDetail {...makeProps({ discreet: true })} />);

    expect(screen.getByText(DISCREET_PLACEHOLDER)).toBeVisible();
    expect(screen.queryByText(VALUE)).not.toBeInTheDocument();
  });

  it("should still render the title and the description when the value is hidden", () => {
    render(<PnLinfoDetail {...makeProps({ discreet: true })} />);

    expect(screen.getByText(TITLE)).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
  });
});
