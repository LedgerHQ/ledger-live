/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { createMockAccount, createMockCantonCurrency } from "../__tests__/testUtils";
import { createMockDevice } from "../OnboardModal/__tests__/testUtils";
import { handleTopologyChangeError, type NavigationSnapshot } from "./topologyChangeError";

jest.mock("~/renderer/actions/modals");

const mockOpenModal = openModal as jest.MockedFunction<typeof openModal>;
const mockCloseModal = closeModal as jest.MockedFunction<typeof closeModal>;

describe("handleTopologyChangeError", () => {
  const mockDispatch = jest.fn();
  const mockDevice = createMockDevice({
    deviceId: "device1",
  });
  const mockAccounts = [createMockAccount()];
  const cantonCurrency = createMockCantonCurrency();
  const cantonAccount = createMockAccount();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return false when device is not present", () => {
    const result = handleTopologyChangeError(mockDispatch, {
      currency: cantonCurrency,
      device: null,
      accounts: mockAccounts,
      mainAccount: cantonAccount,
    });

    expect(result).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should return false for non-Canton currency", () => {
    const bitcoinCurrency: CryptoCurrency = {
      id: "bitcoin",
      name: "Bitcoin",
      type: "CryptoCurrency",
      family: "bitcoin",
      units: [{ name: "BTC", code: "BTC", magnitude: 8 }],
      ticker: "BTC",
      scheme: "bitcoin",
      color: "#000000",
      managerAppName: "Bitcoin",
      coinType: 0,
      explorerViews: [],
    };

    const result = handleTopologyChangeError(mockDispatch, {
      currency: bitcoinCurrency,
      device: mockDevice,
      accounts: mockAccounts,
      mainAccount: cantonAccount,
    });

    expect(result).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should handle modal navigationSnapshot type", () => {
    const navigationSnapshot = {
      type: "modal" as const,
      modalName: "MODAL_SEND" as const,
      modalData: undefined,
    };

    const result = handleTopologyChangeError(mockDispatch, {
      currency: cantonCurrency,
      device: mockDevice,
      accounts: mockAccounts,
      mainAccount: cantonAccount,
      navigationSnapshot,
    });

    expect(result).toBe(true);
    expect(mockCloseModal).toHaveBeenCalledWith("MODAL_SEND");
    expect(mockOpenModal).toHaveBeenCalledWith("MODAL_CANTON_ONBOARD_ACCOUNT", {
      currency: cantonCurrency,
      device: mockDevice,
      selectedAccounts: [],
      existingAccounts: mockAccounts,
      editedNames: {},
      isReonboarding: true,
      accountToReonboard: cantonAccount,
      navigationSnapshot,
    });
  });

  it("should handle drawer navigationSnapshot type", () => {
    const navigationSnapshot = {
      type: "drawer" as const,
      drawerComponent: jest.fn(),
      drawerProps: { prop1: "value1" },
    } as unknown as NavigationSnapshot;

    const result = handleTopologyChangeError(mockDispatch, {
      currency: cantonCurrency,
      device: mockDevice,
      accounts: mockAccounts,
      mainAccount: cantonAccount,
      navigationSnapshot,
    });

    expect(result).toBe(true);
    expect(mockCloseModal).not.toHaveBeenCalled();
    expect(mockOpenModal).toHaveBeenCalledWith("MODAL_CANTON_ONBOARD_ACCOUNT", {
      currency: cantonCurrency,
      device: mockDevice,
      selectedAccounts: [],
      existingAccounts: mockAccounts,
      editedNames: {},
      isReonboarding: true,
      accountToReonboard: cantonAccount,
      navigationSnapshot,
    });
  });
});
