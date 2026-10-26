import { bitcoinRegistration } from "./bitcoin";
import { mockUtxoDescriptor, MOCK_XPUB } from "../portfolioApi.mock";

describe("bitcoinRegistration", () => {
  it("registers a Bitcoin account by its xpub and the full path", () => {
    expect(bitcoinRegistration.register(mockUtxoDescriptor(MOCK_XPUB))).toEqual({
      type: "auto_derive",
      network: "bitcoin",
      xpub: MOCK_XPUB,
      derivationPath: "m/84h/0h/0h/0/0",
    });
  });

  it("skips an xpub the service would reject", () => {
    expect(bitcoinRegistration.register(mockUtxoDescriptor("short"))).toBeUndefined();
  });
});
