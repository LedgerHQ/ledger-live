import type { PortfolioRegistration } from "../types";
import { MOCK_EVM_ADDRESS, MOCK_XPUB } from "../portfolioApi.mock";
import { planRegistrations, registrationKey } from "./reconcile";

const bitcoin: PortfolioRegistration = {
  type: "auto_derive",
  network: "bitcoin",
  xpub: MOCK_XPUB,
  derivationPath: "m/84h/0h/0h/0/0",
};
const ethereum: PortfolioRegistration = { type: "evm", address: MOCK_EVM_ADDRESS };

describe("planRegistrations", () => {
  it("adds only what the portfolio does not register yet", () => {
    const plan = planRegistrations(
      [{ id: "reg-btc", type: "auto_derive", network: "bitcoin", xpub: MOCK_XPUB }],
      [bitcoin, ethereum],
    );
    expect(plan).toEqual({ toAdd: [ethereum], toRemove: [] });
  });

  it("removes a registration no wallet account backs anymore", () => {
    const plan = planRegistrations(
      [
        { id: "reg-btc", type: "auto_derive", network: "bitcoin", xpub: MOCK_XPUB },
        { id: "reg-eth", type: "evm", address: MOCK_EVM_ADDRESS },
      ],
      [ethereum],
    );
    expect(plan).toEqual({ toAdd: [], toRemove: ["reg-btc"] });
  });

  it("removes everything when the wallet has no account left", () => {
    const plan = planRegistrations([{ id: "reg-eth", type: "evm", address: MOCK_EVM_ADDRESS }], []);
    expect(plan.toRemove).toEqual(["reg-eth"]);
  });

  it("keeps an entry it cannot identify", () => {
    const plan = planRegistrations([{ id: "reg-x", type: "account", network: "cardano" }], []);
    expect(plan.toRemove).toEqual([]);
  });

  it("matches a hexadecimal address whatever its case", () => {
    expect(
      registrationKey({
        id: "r",
        type: "evm",
        address: MOCK_EVM_ADDRESS.toUpperCase().replace("0X", "0x"),
      }),
    ).toBe(registrationKey(ethereum));
  });
});
