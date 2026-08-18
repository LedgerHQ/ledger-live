import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { HelpListItem } from "../components/HelpListItem";

describe("HelpListItem", () => {
  it("should render the description on up to two lines instead of truncating", () => {
    render(
      <HelpListItem
        onPress={jest.fn()}
        title="Ledger Support"
        description="A long description that should wrap onto a second line in some languages"
        icon={Information}
      />,
    );

    const description = screen.getByText(/a long description/i);
    expect(description.props.numberOfLines).toBe(2);
  });
});
