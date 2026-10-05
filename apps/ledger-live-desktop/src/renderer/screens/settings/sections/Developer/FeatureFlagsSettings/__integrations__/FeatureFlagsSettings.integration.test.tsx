import React from "react";
import { render, screen } from "tests/testSetup";
import {
  clearContentAbTestOverrides,
  getContentAbTests,
  isContentAbTestOverridden,
  setContentAbTestCopy,
  setContentAbTestOverride,
} from "@features/platform-content-ab-tests";
import { SettingsSectionBody } from "../../../../SettingsSection";
import FeatureFlagsSettings from "..";

const enabled = { enabled: true, copy: { "banner.title": "Hello" } };
const disabled = { enabled: false, copy: { "banner.title": "Hello" } };

const experiment = (id: string, payload: object) => ({
  [`feature_copy_${id}`]: {
    asString: () => JSON.stringify(payload),
    getSource: () => "remote" as const,
  },
});

const renderSettings = () =>
  render(
    <SettingsSectionBody>
      <FeatureFlagsSettings />
    </SettingsSectionBody>,
  );

describe("FeatureFlagsSettings content A/B tests", () => {
  beforeEach(() => {
    clearContentAbTestOverrides();
    setContentAbTestCopy({});
  });

  it("should list experiments on the all tab and hide them when the search misses", async () => {
    setContentAbTestCopy({
      ...experiment("zebra", enabled),
      ...experiment("banner", disabled),
    });
    const { user } = renderSettings();

    await user.click(screen.getByRole("button", { name: "Show" }));

    expect(screen.getByText("banner")).toBeVisible();
    expect(screen.getByText("zebra")).toBeVisible();

    const search = screen.getByPlaceholderText("Search");
    await user.type(search, "banner");
    expect(screen.getByText("banner")).toBeVisible();
    expect(screen.queryByText("zebra")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "no-such-experiment");

    expect(screen.queryByText("banner")).not.toBeInTheDocument();
    expect(screen.queryByText("zebra")).not.toBeInTheDocument();
    expect(screen.queryByText("contentAbTests")).not.toBeInTheDocument();
  });

  it("should expand the group, toggle every experiment, and restore a local override", async () => {
    setContentAbTestCopy({
      ...experiment("banner", enabled),
      ...experiment("zebra", disabled),
    });
    setContentAbTestOverride("banner", { ...enabled, copy: { "banner.title": "Local" } });
    const { user } = renderSettings();

    await user.click(screen.getByRole("button", { name: "Show" }));
    await user.click(screen.getByRole("button", { name: "Groups" }));
    await user.click(screen.getByText("contentAbTests"));

    expect(screen.getByText("banner")).toBeVisible();
    for (const tag of screen.getAllByText("overridden locally")) {
      expect(tag).toBeVisible();
    }

    let groupHeader: HTMLElement | null = screen.getByText("contentAbTests");
    while (groupHeader && !groupHeader.querySelector('[role="switch"]')) {
      groupHeader = groupHeader.parentElement;
    }
    await user.click(groupHeader?.querySelector('[role="switch"]') as HTMLElement);

    expect(getContentAbTests().banner.enabled).toBe(true);
    expect(getContentAbTests().zebra.enabled).toBe(true);

    await user.click(screen.getByText("banner"));

    await user.click(screen.getByRole("button", { name: "Restore all flags values" }));
    expect(isContentAbTestOverridden("banner")).toBe(false);

    setContentAbTestOverride("banner", { ...enabled, copy: { "banner.title": "Local" } });
    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(isContentAbTestOverridden("banner")).toBe(false);
  });

  it("should keep the group visible when the search matches its name", async () => {
    setContentAbTestCopy({
      ...experiment("banner", disabled),
    });
    const { user } = renderSettings();

    await user.click(screen.getByRole("button", { name: "Show" }));
    await user.type(screen.getByPlaceholderText("Search"), "contentAbTests");
    await user.click(screen.getByRole("button", { name: "Groups" }));

    expect(screen.getByText("contentAbTests")).toBeVisible();
    expect(screen.queryByText("banner")).not.toBeInTheDocument();
  });
});
