import test from "../../fixtures/common";
import { Layout } from "../../models/Layout";
import { expect } from "@playwright/test";

test.use({ userdata: "1AccountBTC1AccountETH" });

test.use({
  env: {
    // disable mock for countervalues
    MOCK_COUNTERVALUES: "",
  },
});

test("Countervalues: at least one call is made and successful to the API", async ({ page }) => {
  const layout = new Layout(page);
  const firstSuccessfulQuery = new Promise((resolve, reject) => {
    page.on("response", response => {
      if (
        response.url().startsWith("https://countervalues.live.ledger.com") &&
        response.status() === 200
      ) {
        resolve(response);
      }
    });
  });

  layout.topbarSynchronizeButton.click();

  await test.step(
    "has used countervalues api in HTTP and at least one HTTP 200 happened",
    async () => {
      expect(await firstSuccessfulQuery).toBeDefined();
    },
  );
});
