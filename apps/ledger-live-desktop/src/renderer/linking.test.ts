import { track } from "@shared/analytics";
import { shell } from "~/renderer/bridge";
import { openURL } from "./linking";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
}));

jest.mock("~/renderer/bridge", () => ({
  shell: { openExternal: jest.fn() },
}));

const txUrl =
  "https://etherscan.io/tx/0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";

describe("openURL", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tracks the full URL by default", () => {
    openURL(txUrl);

    expect(track).toHaveBeenCalledWith("OpenURL", { url: txUrl });
    expect(shell.openExternal).toHaveBeenCalledWith(txUrl);
  });

  it("tracks only the origin of a sensitive URL, and still opens the full URL", () => {
    openURL(txUrl, "viewOperationInExplorer", { currencyId: "Ethereum" }, { sensitive: true });

    expect(track).toHaveBeenCalledWith("viewOperationInExplorer", {
      currencyId: "Ethereum",
      url: "https://etherscan.io",
    });
    expect(shell.openExternal).toHaveBeenCalledWith(txUrl);
  });

  it("does not track when the event name is empty", () => {
    openURL(txUrl, "", {}, { sensitive: true });

    expect(track).not.toHaveBeenCalled();
    expect(shell.openExternal).toHaveBeenCalledWith(txUrl);
  });
});
