import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { MODULAR_DIALOG_STEP, PAY_ACCOUNT_UI_USE_CASE } from "../../types";
import { getModularDialogStepHeading } from "../getModularDialogStepHeading";

describe("getModularDialogStepHeading", () => {
  it("should return deposit copy on asset selection for perps fund", () => {
    expect(
      getModularDialogStepHeading(
        MODULAR_DIALOG_STEP.ASSET_SELECTION,
        PERPS_UI_USE_CASE.fund,
        true,
      ),
    ).toEqual({
      titleKey: "modularAssetDrawer.selectDepositCurrencyTitle",
      descriptionKey: "modularAssetDrawer.selectDepositCurrencyDescription",
    });
  });

  it("should return perps receive copy on account selection when accounts exist", () => {
    expect(
      getModularDialogStepHeading(
        MODULAR_DIALOG_STEP.ACCOUNT_SELECTION,
        PERPS_UI_USE_CASE.receive,
        true,
      ),
    ).toEqual({
      titleKey: "modularAssetDrawer.selectAccountPerpsTitle",
      descriptionKey: "modularAssetDrawer.selectAccountPerpsDescription",
    });
  });

  it("should return empty-state perps receive copy when no accounts exist", () => {
    expect(
      getModularDialogStepHeading(
        MODULAR_DIALOG_STEP.ACCOUNT_SELECTION,
        PERPS_UI_USE_CASE.receive,
        false,
      ),
    ).toEqual({
      titleKey: "modularAssetDrawer.selectAccountPerpsTitle",
      descriptionKey: "modularAssetDrawer.selectAccountPerpsEmptyDescription",
    });
  });

  it("should return pay copy on account selection for the pay use case", () => {
    expect(
      getModularDialogStepHeading(
        MODULAR_DIALOG_STEP.ACCOUNT_SELECTION,
        PAY_ACCOUNT_UI_USE_CASE,
        true,
      ),
    ).toEqual({ titleKey: "modularAssetDrawer.selectAccountToPayFrom" });
  });

  it("should return the default title key for a step without a special use case", () => {
    expect(
      getModularDialogStepHeading(MODULAR_DIALOG_STEP.NETWORK_SELECTION, undefined, true),
    ).toEqual({ titleKey: "modularAssetDrawer.selectNetwork" });
  });
});
