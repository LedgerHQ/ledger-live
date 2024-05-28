import { expect } from "@playwright/test";
import { getEnv } from "@ledgerhq/live-env";
import test from "../../fixtures/common";
import { Layout } from "../../component/layout.component";

test.use({ userdata: "1AccountBTC1AccountETH" });

test.use({
  env: {
    // disable mock for countervalues
    MOCK_COUNTERVALUES: "",
  },
});

test("Countervalues: at least one call is made and successful to the API", async ({ page }) => {
  const layout = new Layout(page);

  await test.step("has used countervalues api in HTTP and at least one HTTP 200 happened", async () => {
    const firstSuccessfulQuery = new Promise(resolve => {
      page.on("response", response => {
        if (
          response.url().startsWith(getEnv("LEDGER_COUNTERVALUES_API")) &&
          response.status() === 200
        ) {
          resolve(response);
        }
      });
    });

    await layout.topbarSynchronizeButton.click();

    expect(await firstSuccessfulQuery).toBeDefined();
  });
});
