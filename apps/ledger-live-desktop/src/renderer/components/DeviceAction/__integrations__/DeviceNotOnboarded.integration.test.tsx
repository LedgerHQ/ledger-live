import React from "react";
import { DeviceModelId } from "@ledgerhq/devices";
import { useTranslation } from "react-i18next";
import { Route, Routes } from "react-router";
import { render, screen } from "tests/testSetup";
import { SelectDevice } from "~/renderer/components/Onboarding/Screens/SelectDevice";
import { Welcome } from "~/renderer/components/Onboarding/Screens/Welcome";
import { DeviceNotOnboardedErrorComponent } from "../rendering";

function UnseededNanoSPlus() {
  const { t } = useTranslation();

  return (
    <DeviceNotOnboardedErrorComponent
      t={t}
      device={{ deviceId: "nano-s-plus", modelId: DeviceModelId.nanoSP, wired: true }}
    />
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<UnseededNanoSPlus />} />
      <Route path="/onboarding" element={<Welcome />} />
      <Route path="/onboarding/select-device" element={<SelectDevice />} />
    </Routes>
  );
}

describe("My Ledger setup for an unseeded Nano S Plus", () => {
  it("opens What's your Ledger?", async () => {
    const { user } = render(<AppRoutes />, { initialRoute: "/" });

    await user.click(screen.getByRole("button", { name: "Set up my Ledger Nano S Plus" }));

    expect(await screen.findByText("What's your Ledger?")).toBeVisible();
  });
});
