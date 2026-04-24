import React from "react";
import { Operation, DailyOperationsSection } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import { SectionSeparator } from "../SectionSeparator";

const operation: Operation = {
  id: "1",
  hash: "1",
  type: "IN",
  value: new BigNumber(100),
  fee: new BigNumber(0),
  senders: ["1"],
  recipients: ["2"],
  blockHeight: 1,
  blockHash: "1",
  date: new Date(),
  accountId: "1",
  extra: {},
};

const section: DailyOperationsSection = {
  day: new Date(),
  data: [operation],
};

describe("SectionSeparator", () => {
  it("should render after section header", () => {
    render(
      <SectionSeparator leadingItem={null} trailingItem={operation} trailingSection={section} />,
    );
    expect(screen.getByTestId("operations-list-section-separator")).toBeVisible();
    expect(screen.getByTestId("operations-list-section-separator")).toHaveStyle({
      height: 4,
    });
  });

  it("should render between sections", () => {
    render(
      <SectionSeparator leadingItem={operation} trailingItem={null} trailingSection={section} />,
    );
    expect(screen.getByTestId("operations-list-section-separator")).toBeVisible();
    expect(screen.getByTestId("operations-list-section-separator")).toHaveStyle({
      height: 16,
    });
  });

  it("should not render when there is no leading item and no trailing item", () => {
    render(<SectionSeparator leadingItem={null} trailingItem={null} trailingSection={section} />);
    expect(screen.queryByTestId("operations-list-section-separator")).toBeNull();
  });

  it("should not render when there is no trailing section after the last item in a section", () => {
    render(
      <SectionSeparator leadingItem={operation} trailingItem={null} trailingSection={undefined} />,
    );
    expect(screen.queryByTestId("operations-list-section-separator")).toBeNull();
  });
});
