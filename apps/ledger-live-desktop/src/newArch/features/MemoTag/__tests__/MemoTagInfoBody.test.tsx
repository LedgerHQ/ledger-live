/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testUtils";
import MemoTagInfoBody from "../components/MemoTagInfoBody";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("MemoTagInfoBody", () => {
  it("should display MemoTagInfoBody correctly", async () => {
    render(<MemoTagInfoBody />);

    const memoTagInfoBody = screen.getByTestId("memo-tag-info-body");

    expect(memoTagInfoBody).toBeVisible();
  });
});
