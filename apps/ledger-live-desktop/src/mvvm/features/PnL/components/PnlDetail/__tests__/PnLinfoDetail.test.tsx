import React from "react";
import { render, screen } from "tests/testSetup";
import { PnLinfoDetail } from "../PnLinfoDetail";

type PnLinfoDetailProps = React.ComponentProps<typeof PnLinfoDetail>;

const TITLE = "Realised return";
const DESCRIPTION = "Estimated gain or loss on your current holdings.";
const VALUE = "$243.32";

const makeProps = (overrides: Partial<PnLinfoDetailProps> = {}): PnLinfoDetailProps => ({
  title: TITLE,
  description: DESCRIPTION,
  value: VALUE,
  ...overrides,
});

describe("PnLinfoDetail", () => {
  it("renders the title, description and value", () => {
    render(<PnLinfoDetail {...makeProps()} />);

    expect(screen.getByText(TITLE)).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
    expect(screen.getByText(VALUE)).toBeVisible();
  });
});
