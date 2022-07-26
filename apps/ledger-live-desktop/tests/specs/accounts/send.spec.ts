import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../models/Layout";

//test.use({ userdata: "skip-onboarding" });

test(`ADA send`, async ({ page }) => {
  const deviceAction = new DeviceAction(page);
  const layout = new Layout(page);

  await test.step(`Open Account`, async () => {
  
  });
});