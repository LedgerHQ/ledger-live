import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { SectionCard } from "../SectionCard";

describe("SectionCard", () => {
  it("should render children without title", () => {
    render(
      <SectionCard>
        <Text>Card content</Text>
      </SectionCard>,
    );
    expect(screen.getByText("Card content")).toBeOnTheScreen();
    expect(screen.queryByText("Section Title")).not.toBeOnTheScreen();
  });

  it("should render title and children when title is provided", () => {
    render(
      <SectionCard title="Section Title">
        <Text>Card content</Text>
      </SectionCard>,
    );
    expect(screen.getByText("Section Title")).toBeOnTheScreen();
    expect(screen.getByText("Card content")).toBeOnTheScreen();
  });
});
