import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import {
  clearContentAbTestOverrides,
  getContentAbTests,
  isContentAbTestOverridden,
  setContentAbTests,
} from "@features/platform-content-ab-tests";
import ContentAbTestEdit from "./ContentAbTestEdit";

const editPayload = (payload: unknown) =>
  fireEvent.change(screen.getByRole("textbox"), { target: { value: JSON.stringify(payload) } });

describe("ContentAbTestEdit", () => {
  beforeEach(() => {
    clearContentAbTestOverrides();
    setContentAbTests({
      upgradeBanner: { enabled: true, copy: { "banner.title": "Remote title" } },
    });
  });

  it("toggles enabled on the live payload", async () => {
    const { user } = render(
      <ContentAbTestEdit testName="upgradeBanner" testValue={getContentAbTests().upgradeBanner} />,
    );

    await user.click(screen.getByRole("switch"));

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(true);
    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: false,
      copy: { "banner.title": "Remote title" },
    });
  });

  it("overrides copy from the edited payload", async () => {
    const { user } = render(
      <ContentAbTestEdit testName="upgradeBanner" testValue={getContentAbTests().upgradeBanner} />,
    );

    editPayload({ enabled: true, copy: { "banner.title": "Mocked title" } });
    await user.click(screen.getByText("Override"));

    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: true,
      copy: { "banner.title": "Mocked title" },
    });
  });

  it("accepts a payload without trackingConfiguration and rejects a malformed one", async () => {
    const { user } = render(<ContentAbTestEdit testName="newExperiment" testValue={undefined} />);

    editPayload({ enabled: true, copy: {}, trackingConfiguration: {} });
    await user.click(screen.getByText("Override"));

    expect(isContentAbTestOverridden("newExperiment")).toBe(false);
    expect(screen.getByText(/Invalid payload/)).toBeVisible();

    editPayload({ enabled: true, copy: { "banner.title": "Mocked title" } });
    await user.click(screen.getByText("Override"));

    expect(getContentAbTests().newExperiment).toEqual({
      enabled: true,
      copy: { "banner.title": "Mocked title" },
    });
  });

  it("restores the remote payload", async () => {
    const { user } = render(
      <ContentAbTestEdit testName="upgradeBanner" testValue={{ enabled: false, copy: {} }} />,
    );

    await user.click(screen.getByText("Restore"));

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(false);
    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: true,
      copy: { "banner.title": "Remote title" },
    });
  });
});
