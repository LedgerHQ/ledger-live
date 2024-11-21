/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "tests/testUtils";
import * as LinkingHelpers from "~/renderer/linking";
import LearnMoreCta from "../components/LearnMoreCta";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("MemoTagInfoBody", () => {
  it("should display MemoTagInfoBody correctly", async () => {
    render(<LearnMoreCta url="example.domain.com" />);

    const learnMoreLink = screen.getByText(/Learn more about Tag\/Memo/);

    expect(learnMoreLink).toBeVisible();

    fireEvent.click(learnMoreLink);

    jest.spyOn(LinkingHelpers, "openURL");
    // spec: when a user clicks on the learn more link, it should open the link
    expect(LinkingHelpers.openURL).toHaveBeenCalledWith("example.domain.com");
  });
});
