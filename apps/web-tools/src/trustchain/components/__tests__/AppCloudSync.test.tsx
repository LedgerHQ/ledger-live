import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppWalletSync } from "../AppCloudSync";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-cloud-sync"),
}));

const mockGenAccount = jest.fn(() => ({
  id: "account-1",
  currency: { id: "ethereum", units: [{ magnitude: 18 }] },
  index: 0,
  seedIdentifier: "seed",
  derivationMode: "",
  freshAddress: "0x",
}));
jest.mock("@ledgerhq/coin-framework/mocks/account", () => ({
  genAccount: (...args: unknown[]) => Reflect.apply(mockGenAccount, null, args),
}));

jest.mock("@ledgerhq/live-wallet/accountName", () => ({
  getDefaultAccountName: jest.fn((account: { id: string }) => `Account ${account.id}`),
}));

jest.mock("@ledgerhq/live-wallet/cloudsync/index", () => ({
  CloudSyncSDK: jest.fn().mockImplementation(() => ({
    pull: jest.fn(),
    push: jest.fn(),
    destroy: jest.fn(),
    listenNotifications: jest.fn(() => ({
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    })),
  })),
}));

jest.mock("@ledgerhq/live-wallet/walletsync/index", () => ({
  __esModule: true,
  default: {
    schema: { parse: jest.fn((d: unknown) => d) },
  },
  liveSlug: "test",
}));

jest.mock("../../context", () => ({
  useTrustchainSDK: jest.fn(() => ({})),
}));

jest.mock("../../useEnv", () => ({
  __esModule: true,
  default: jest.fn(() => "https://staging"),
}));

const mockSetData = jest.fn();

const defaultProps = {
  trustchain: {} as never,
  setTrustchain: jest.fn(),
  memberCredentials: {} as never,
  data: null as never,
  setData: mockSetData,
  version: 0,
  setVersion: jest.fn(),
  readOnly: false,
};

describe("AppWalletSync (AppCloudSync)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call genAccount with uuid when generating random account data", async () => {
    const mathRandomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);
    const user = userEvent.setup();
    render(<AppWalletSync {...defaultProps} />);

    const diceButton = screen.getByRole("button", { name: /🎲/ });
    await user.click(diceButton);

    expect(mockGenAccount).toHaveBeenCalled();
    expect(
      mockGenAccount.mock.calls.every((call: unknown[]) => call[0] === "mock-uuid-cloud-sync"),
    ).toBe(true);
    expect(mockSetData).toHaveBeenCalled();
    mathRandomSpy.mockRestore();
  });

  it("should call genAccount with a uuid-shaped seed for each generated account", async () => {
    const mathRandomSpy = jest.spyOn(Math, "random").mockReturnValue(0.7);
    const user = userEvent.setup();
    render(<AppWalletSync {...defaultProps} />);

    const diceButton = screen.getByRole("button", { name: /🎲/ });
    await user.click(diceButton);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(mockGenAccount).toHaveBeenCalled();
    for (const call of mockGenAccount.mock.calls as unknown as [string, ...unknown[]][]) {
      expect(call[0]).toMatch(uuidRegex);
    }
    mathRandomSpy.mockRestore();
  });
});
