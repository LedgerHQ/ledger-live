import type { Page } from "@playwright/test";
import { PredictionsDialog } from "tests/page/dialog/predictions.dialog";

export class PredictionsConsentDialog extends PredictionsDialog {
  constructor(page: Page) {
    super(page, "consent");
  }
}
