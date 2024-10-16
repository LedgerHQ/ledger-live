/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "tests/testUtils";
import MemoTagInfoBody from "../components/MemoTagInfoBody";
import { MEMO_TAG_LEARN_MORE_LINK } from "../constants";
import * as LinkingHelpers from "~/renderer/linking";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("MemoTagInfoBody", () => {
  it("should display MemoTagInfoBody correctly", async () => {
    render(<MemoTagInfoBody />);

    const memoTagInfoBody = screen.getByTestId("memo-tag-info-body");
    const learnMoreLink = screen.getByText(/Learn more about Tag\/Memo/);

    expect(memoTagInfoBody).toBeVisible();
    expect(learnMoreLink).toBeVisible();

    fireEvent.click(learnMoreLink);

    jest.spyOn(LinkingHelpers, "openURL");
    // spec: when a user clicks on the learn more link, it should open the link
    expect(LinkingHelpers.openURL).toHaveBeenCalledWith(MEMO_TAG_LEARN_MORE_LINK);
  });
});
