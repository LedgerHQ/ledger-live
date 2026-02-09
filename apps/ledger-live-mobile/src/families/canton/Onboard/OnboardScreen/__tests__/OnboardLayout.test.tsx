import { render, screen } from "@tests/test-renderer";
import React from "react";
import { Text, View } from "react-native";
import { OnboardLayout } from "../components/OnboardLayout";
import { createMockAccount } from "./test-utils";

describe("OnboardLayout", () => {
  const mockAccounts = [createMockAccount({ id: "account-1" })];

  it("should render with accounts and children", () => {
    render(
      <OnboardLayout accounts={mockAccounts} selectedIds={["account-1"]} isReonboarding={false}>
        <View>
          <Text>Custom Content</Text>
        </View>
      </OnboardLayout>,
    );

    expect(screen.getByText("Onboarding")).toBeDefined();
    expect(screen.getByText("Account")).toBeDefined();
    expect(screen.getByText("Ledger Validator")).toBeDefined();
    expect(screen.getByText("Custom Content")).toBeDefined();
  });

  it("should use normal onboarding keys when isReonboarding is false", () => {
    render(
      <OnboardLayout accounts={mockAccounts} selectedIds={["account-1"]} isReonboarding={false} />,
    );

    expect(screen.getByText("Onboarding")).toBeDefined();
    expect(screen.getByText("Account")).toBeDefined();
    expect(screen.getByText("Authorize")).toBeDefined();
  });

  it("should use reonboarding keys when isReonboarding is true", () => {
    render(
      <OnboardLayout accounts={mockAccounts} selectedIds={["account-1"]} isReonboarding={true} />,
    );

    expect(screen.getByText("Account Update Required")).toBeDefined();
    expect(screen.getByText("Account")).toBeDefined();
    expect(screen.getByText("Re-authorize Validator")).toBeDefined();
  });

  it("should render validator section", () => {
    render(
      <OnboardLayout accounts={mockAccounts} selectedIds={["account-1"]} isReonboarding={false} />,
    );

    expect(screen.getByText("Ledger Validator")).toBeDefined();
  });
});
