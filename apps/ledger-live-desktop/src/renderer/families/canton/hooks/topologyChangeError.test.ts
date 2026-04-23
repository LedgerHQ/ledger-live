/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import CantonReonboardDrawer from "../AddAccountDrawer/CantonReonboardDrawer";
import { createMockAccount, createMockCantonCurrency } from "../__tests__/testUtils";
import { createMockDevice } from "../OnboardModal/__tests__/testUtils";
import { handleTopologyChangeError } from "./topologyChangeError";

jest.mock("~/renderer/actions/modals", () => ({
  closeModal: jest.fn((name: string) => ({
    type: "MODAL_CLOSE",
    payload: { name },
  })),
  openModal: jest.fn((name: string, data?: unknown) => ({
    type: "MODAL_OPEN",
    payload: { name, data },
  })),
}));

jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: jest.fn(),
}));

const mockCloseModal = closeModal as jest.MockedFunction<typeof closeModal>;
const mockOpenModal = openModal as jest.MockedFunction<typeof openModal>;
const mockSetDrawer = setDrawer as jest.MockedFunction<typeof setDrawer>;

const mockDispatch = jest.fn();

const createNonCantonCurrency = (): CryptoCurrency => ({
  ...createMockCantonCurrency(),
  id: "bitcoin",
  name: "Bitcoin",
  family: "bitcoin",
  ticker: "BTC",
});

describe("handleTopologyChangeError", () => {
  const mockDevice = createMockDevice({
    deviceId: "device1",
  });
  const cantonCurrency = createMockCantonCurrency();
  const cantonAccount = createMockAccount();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return false when device is not present", () => {
    const result = handleTopologyChangeError(mockDispatch, {
      currency: cantonCurrency,
      device: null,
      mainAccount: cantonAccount,
      useModularDrawer: true,
    });

    expect(result).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockSetDrawer).not.toHaveBeenCalled();
  });

  it("should return false for non-Canton currency", () => {
    const result = handleTopologyChangeError(mockDispatch, {
      currency: createNonCantonCurrency(),
      device: mockDevice,
      mainAccount: cantonAccount,
      useModularDrawer: true,
    });

    expect(result).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockSetDrawer).not.toHaveBeenCalled();
  });

  describe("when useModularDrawer is true", () => {
    it("should close existing modal and open reonboarding drawer for modal snapshot", () => {
      const navigationSnapshot = {
        type: "modal" as const,
        modalName: "MODAL_SEND" as const,
        modalData: undefined,
      };

      const result = handleTopologyChangeError(mockDispatch, {
        currency: cantonCurrency,
        device: mockDevice,
        mainAccount: cantonAccount,
        useModularDrawer: true,
        navigationSnapshot,
      });

      expect(result).toBe(true);
      expect(mockCloseModal).toHaveBeenCalledWith("MODAL_SEND");
      expect(mockSetDrawer).toHaveBeenCalledWith(CantonReonboardDrawer, {
        currency: cantonCurrency,
        accountToReonboard: cantonAccount,
        navigationSnapshot,
      });
    });

    it("should open reonboarding drawer without closing for transfer-proposal snapshot", () => {
      const mockHandler = jest.fn();
      const navigationSnapshot = {
        type: "transfer-proposal" as const,
        handler: mockHandler,
        props: {
          action: "accept" as const,
          contractId: "contract-123",
        },
      };

      const result = handleTopologyChangeError(mockDispatch, {
        currency: cantonCurrency,
        device: mockDevice,
        mainAccount: cantonAccount,
        useModularDrawer: true,
        navigationSnapshot,
      });

      expect(result).toBe(true);
      expect(mockCloseModal).not.toHaveBeenCalled();
      expect(mockSetDrawer).toHaveBeenCalledWith(CantonReonboardDrawer, {
        currency: cantonCurrency,
        accountToReonboard: cantonAccount,
        navigationSnapshot,
      });
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe("when useModularDrawer is false", () => {
    it("should close existing modal and open reonboarding modal for modal snapshot", () => {
      const navigationSnapshot = {
        type: "modal" as const,
        modalName: "MODAL_SEND" as const,
        modalData: undefined,
      };

      const result = handleTopologyChangeError(mockDispatch, {
        currency: cantonCurrency,
        device: mockDevice,
        mainAccount: cantonAccount,
        useModularDrawer: false,
        navigationSnapshot,
      });

      expect(result).toBe(true);
      expect(mockCloseModal).toHaveBeenCalledWith("MODAL_SEND");
      expect(mockOpenModal).toHaveBeenCalledWith("MODAL_CANTON_ONBOARD_ACCOUNT", {
        currency: cantonCurrency,
        selectedAccounts: [],
        editedNames: {},
        isReonboarding: true,
        accountToReonboard: cantonAccount,
        navigationSnapshot,
      });
      expect(mockSetDrawer).not.toHaveBeenCalled();
    });

    it("should open reonboarding modal without closing for transfer-proposal snapshot", () => {
      const mockHandler = jest.fn();
      const navigationSnapshot = {
        type: "transfer-proposal" as const,
        handler: mockHandler,
        props: {
          action: "accept" as const,
          contractId: "contract-123",
        },
      };

      const result = handleTopologyChangeError(mockDispatch, {
        currency: cantonCurrency,
        device: mockDevice,
        mainAccount: cantonAccount,
        useModularDrawer: false,
        navigationSnapshot,
      });

      expect(result).toBe(true);
      expect(mockCloseModal).not.toHaveBeenCalled();
      expect(mockOpenModal).toHaveBeenCalledWith("MODAL_CANTON_ONBOARD_ACCOUNT", {
        currency: cantonCurrency,
        selectedAccounts: [],
        editedNames: {},
        isReonboarding: true,
        accountToReonboard: cantonAccount,
        navigationSnapshot,
      });
      expect(mockSetDrawer).not.toHaveBeenCalled();
    });
  });
});
