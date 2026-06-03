import React from "react";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import i18n from "~/renderer/i18n/init";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual<typeof import("react-router")>("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../Tutorial", () => ({
  ScreenId: {
    howToGetStarted: "how-to-get-started",
    pairMyNano: "pair-my-nano",
    importYourRecoveryPhrase: "import-your-recovery-phrase",
    recoverHowTo: "recover-how-to",
  },
}));

jest.mock("../../../index", () => {
  const { createContext } = jest.requireActual<typeof import("react")>("react");
  return {
    OnboardingContext: createContext<{
      deviceModelId: DeviceModelId | null;
      setDeviceModelId: (id: DeviceModelId | null) => void;
    }>({
      deviceModelId: null,
      setDeviceModelId: () => {},
    }),
  };
});

import { OnboardingContext } from "../../../index";
import { SelectUseCase } from "../index";

const renderSelectUseCase = (
  deviceModelId: DeviceModelId,
  featureFlags: Parameters<typeof withFlagOverrides>[0] = {},
) => {
  const setUseCase = jest.fn();
  const setOpenedPedagogyModal = jest.fn();

  const view = render(
    <OnboardingContext.Provider value={{ deviceModelId, setDeviceModelId: jest.fn() }}>
      <SelectUseCase setUseCase={setUseCase} setOpenedPedagogyModal={setOpenedPedagogyModal} />
    </OnboardingContext.Provider>,
    {
      initialState: withFlagOverrides(featureFlags),
    },
  );

  return { ...view, setUseCase, setOpenedPedagogyModal };
};

describe("SelectUseCase counterfeit warning gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show the dialog when the flag is on and the device is a legacy Nano", async () => {
    const { user } = renderSelectUseCase(DeviceModelId.nanoX, {
      lwdOnboardingCounterfeitWarning: { enabled: true },
    });

    await user.click(screen.getByTestId("v3-onboarding-new-device"));

    expect(screen.getByTestId("counterfeit-warning-dialog")).toBeVisible();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should navigate immediately when the flag is off on a legacy Nano", async () => {
    const { user } = renderSelectUseCase(DeviceModelId.nanoX, {
      lwdOnboardingCounterfeitWarning: { enabled: false },
    });

    await user.click(screen.getByTestId("v3-onboarding-new-device"));

    expect(screen.queryByTestId("counterfeit-warning-dialog")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding/setup-device/how-to-get-started");
  });

  it("should navigate immediately when the flag is on but the device is not legacy", async () => {
    const { user } = renderSelectUseCase(DeviceModelId.stax, {
      lwdOnboardingCounterfeitWarning: { enabled: true },
    });

    await user.click(screen.getByTestId("v3-onboarding-new-device"));

    expect(screen.queryByTestId("counterfeit-warning-dialog")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding/setup-device/how-to-get-started");
  });

  it("should navigate immediately when the flag is off on a non-legacy device", async () => {
    const { user } = renderSelectUseCase(DeviceModelId.stax, {
      lwdOnboardingCounterfeitWarning: { enabled: false },
    });

    await user.click(screen.getByTestId("v3-onboarding-new-device"));

    expect(screen.queryByTestId("counterfeit-warning-dialog")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding/setup-device/how-to-get-started");
  });

  it("should continue setup navigation after proceeding from the dialog", async () => {
    const { user } = renderSelectUseCase(DeviceModelId.nanoX, {
      lwdOnboardingCounterfeitWarning: { enabled: true },
    });

    await user.click(screen.getByTestId("v3-onboarding-new-device"));
    await user.click(
      screen.getByRole("button", { name: i18n.t("onboarding.counterfeitWarning.cta.primary") }),
    );

    expect(mockNavigate).toHaveBeenCalledWith("/onboarding/setup-device/how-to-get-started");
  });
});
