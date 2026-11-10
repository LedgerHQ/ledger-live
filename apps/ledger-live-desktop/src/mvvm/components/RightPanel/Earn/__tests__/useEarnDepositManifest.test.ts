import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { withDepositWidgetPath } from "../useEarnDepositManifest";

const manifest = (url: string) => ({ id: "earn", url }) as unknown as LiveAppManifest;

describe("withDepositWidgetPath", () => {
  it("appends the widget path to the manifest origin", () => {
    expect(withDepositWidgetPath(manifest("https://earn.ledger.com")).url.toString()).toBe(
      "https://earn.ledger.com/deposit-widget",
    );
  });

  it("keeps the query and avoids a double slash", () => {
    expect(withDepositWidgetPath(manifest("http://localhost:3000/?a=1")).url.toString()).toBe(
      "http://localhost:3000/deposit-widget?a=1",
    );
  });
});
