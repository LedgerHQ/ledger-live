import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  clearContentAbTestOverrides,
  getContentAbTests,
  isContentAbTestOverridden,
  setContentAbTestCopy,
} from "@features/platform-content-ab-tests";
import { i18n } from "~/context/Locale";
import ContentAbTestEdit from "./ContentAbTestEdit";

const remoteExperiment = (payload: object) => ({
  feature_copy_upgrade_banner: {
    asString: () => JSON.stringify(payload),
    getSource: () => "remote" as const,
  },
});

function renderEdit(testName: string, testValue = getContentAbTests()[testName]) {
  return render(<ContentAbTestEdit testName={testName} testValue={testValue} />);
}

async function replacePayload(user: ReturnType<typeof renderEdit>["user"], payload: object) {
  const input = screen.getByTestId("content-ab-test-payload");
  await user.clear(input);
  await user.paste(input, JSON.stringify(payload));
}

describe("ContentAbTestEdit", () => {
  let emitSpy: jest.SpyInstance;

  beforeEach(() => {
    emitSpy = jest.spyOn(i18n, "emit");
    clearContentAbTestOverrides();
    setContentAbTestCopy(
      remoteExperiment({ enabled: true, copy: { "banner.title": "Remote title" } }),
    );
  });

  afterEach(() => {
    emitSpy.mockRestore();
  });

  it("toggles enabled on the live payload", async () => {
    const { user } = renderEdit("upgradeBanner");

    await user.press(screen.getByTestId("content-ab-test-enabled"));

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(true);
    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: false,
      copy: { "banner.title": "Remote title" },
    });
  });

  it("overrides copy from the edited payload", async () => {
    const { user } = renderEdit("upgradeBanner");

    await replacePayload(user, { enabled: true, copy: { "banner.title": "Mocked title" } });
    await user.press(screen.getByRole("button", { name: "Apply" }));

    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: true,
      copy: { "banner.title": "Mocked title" },
    });
    expect(emitSpy).toHaveBeenCalledWith("languageChanged", expect.any(String));
  });

  it("accepts a payload and drops a malformed trackingConfiguration", async () => {
    const { user } = renderEdit("newExperiment", undefined);

    await replacePayload(user, {
      enabled: true,
      copy: { "banner.title": "Mocked title" },
      trackingConfiguration: {},
    });
    await user.press(screen.getByRole("button", { name: "Apply" }));

    expect(getContentAbTests().newExperiment).toEqual({
      enabled: true,
      copy: { "banner.title": "Mocked title" },
    });
  });

  it("restores the remote payload", async () => {
    const { user } = renderEdit("upgradeBanner", { enabled: false, copy: {} });

    await user.press(screen.getByRole("button", { name: "Restore" }));

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(false);
    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: true,
      copy: { "banner.title": "Remote title" },
    });
  });
});
