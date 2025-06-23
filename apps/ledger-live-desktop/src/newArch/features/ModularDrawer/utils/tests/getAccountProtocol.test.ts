import { ETH_ACCOUNT, BTC_ACCOUNT, ARB_ACCOUNT } from "../../__mocks__/accounts.mock";
import { getAccountProtocol } from "../getAccountProtocol";

describe("getAccountProtocol", () => {
  it("should return the correct protocol", () => {
    const protocol = getAccountProtocol(ETH_ACCOUNT);

    expect(protocol).toBeNull();
  });

  it("should return the correct protocol for a BTC account", () => {
    const protocol = getAccountProtocol(BTC_ACCOUNT);

    expect(protocol).toBe("legacy");
  });

  it("should return the correct protocol for a BTC account", () => {
    const protocol = getAccountProtocol({ ...BTC_ACCOUNT, derivationMode: "segwit" });

    expect(protocol).toBe("segwit");
  });

  it("should return the correct protocol for a ARB account", () => {
    const protocol = getAccountProtocol(ARB_ACCOUNT);

    expect(protocol).toBeNull();
  });
});
