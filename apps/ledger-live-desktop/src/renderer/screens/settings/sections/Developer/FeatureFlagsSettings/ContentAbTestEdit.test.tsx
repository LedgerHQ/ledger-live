import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import {
  clearContentAbTestOverrides,
  getContentAbTests,
  isContentAbTestOverridden,
  setContentAbTestCopy,
} from "~/firebase/contentAbTestCopy";
import ContentAbTestEdit from "./ContentAbTestEdit";

jest.mock("@ledgerhq/react-ui", () => ({
  Text: ({ children }: { children: React.ReactNode }) => <pre>{children}</pre>,
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Input: ({
    value,
    onChange,
    renderRight,
  }: {
    value?: string;
    onChange: (value?: string) => void;
    renderRight?: () => React.ReactNode;
  }) => (
    <div>
      <input role="textbox" value={value ?? ""} onChange={event => onChange(event.target.value)} />
      {renderRight?.()}
    </div>
  ),
}));

jest.mock("@ledgerhq/react-ui/components/form/BaseInput/index", () => ({
  InputRenderRightContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@ledgerhq/lumen-ui-react", () => ({
  Switch: ({ selected, onChange }: { selected: boolean; onChange: () => void }) => (
    <button role="switch" aria-checked={selected} onClick={onChange} />
  ),
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock("~/renderer/components/Alert", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const editPayload = (payload: unknown) =>
  fireEvent.change(screen.getByRole("textbox"), { target: { value: JSON.stringify(payload) } });

const remoteExperiment = (payload: object) => ({
  feature_copy_upgrade_banner: {
    asString: () => JSON.stringify(payload),
    getSource: () => "remote" as const,
  },
});

async function renderEdit(testName: string, testValue = getContentAbTests()[testName]) {
  const i18n = createInstance();
  await i18n.init({
    lng: "en",
    fallbackLng: "en",
    defaultNS: "app",
    resources: {
      en: {
        app: {
          settings: {
            developer: {
              featureFlagsRestore: "Restore",
              featureFlagsOverride: "Override",
              contentAbTests: { invalidPayload: "Invalid payload" },
            },
          },
        },
      },
    },
  });
  return render(
    <I18nextProvider i18n={i18n}>
      <ContentAbTestEdit testName={testName} testValue={testValue} />
    </I18nextProvider>,
  );
}

describe("ContentAbTestEdit", () => {
  beforeEach(() => {
    clearContentAbTestOverrides();
    setContentAbTestCopy(
      remoteExperiment({ enabled: true, copy: { "banner.title": "Remote title" } }),
    );
  });

  it("toggles enabled on the live payload", async () => {
    await renderEdit("upgradeBanner");

    await act(async () => {
      fireEvent.click(screen.getByRole("switch"));
    });

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(true);
    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: false,
      copy: { "banner.title": "Remote title" },
    });
  });

  it("overrides copy from the edited payload", async () => {
    await renderEdit("upgradeBanner");

    editPayload({ enabled: true, copy: { "banner.title": "Mocked title" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Override"));
    });

    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: true,
      copy: { "banner.title": "Mocked title" },
    });
  });

  it("accepts a payload without trackingConfiguration and rejects a malformed one", async () => {
    await renderEdit("newExperiment", undefined);

    editPayload({ enabled: true, copy: {}, trackingConfiguration: {} });
    await act(async () => {
      fireEvent.click(screen.getByText("Override"));
    });

    expect(isContentAbTestOverridden("newExperiment")).toBe(false);
    expect(screen.getByText(/Invalid payload/)).toBeVisible();

    editPayload({ enabled: true, copy: { "banner.title": "Mocked title" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Override"));
    });

    expect(getContentAbTests().newExperiment).toEqual({
      enabled: true,
      copy: { "banner.title": "Mocked title" },
    });
  });

  it("restores the remote payload", async () => {
    await renderEdit("upgradeBanner", { enabled: false, copy: {} });

    await act(async () => {
      fireEvent.click(screen.getByText("Restore"));
    });

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(false);
    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: true,
      copy: { "banner.title": "Remote title" },
    });
  });
});
