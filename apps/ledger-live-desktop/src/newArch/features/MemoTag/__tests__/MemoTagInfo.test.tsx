/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "tests/testUtils";
import MemoTagInfo from "../components/MemoTagInfo";

describe("MemoTagInfo", () => {
  it("should display MemoTagInfo", async () => {
    render(<MemoTagInfo />);
    const clickabelLabel = screen.getByText(/Need a Tag\/Memo?/);
    expect(clickabelLabel).toBeVisible();
    fireEvent.click(clickabelLabel);
    const memoTagInfoBody = await screen.findByTestId("memo-tag-info-body");
    // spec: when a user clicks on the label, it should display the memo tag info body
    expect(memoTagInfoBody).toBeVisible();
    // spec: when a user clicks on the label, it should disappear
    expect(clickabelLabel).not.toBeInTheDocument();
  });
});
