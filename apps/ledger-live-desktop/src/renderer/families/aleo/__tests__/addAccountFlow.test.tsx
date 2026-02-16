import React from "react";
import { setEnv } from "@ledgerhq/live-env";
import { render, screen } from "tests/testSetup";
import type { State } from "~/renderer/reducers";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import ModularDrawerAddAccountFlowManager from "LLD/features/AddAccountDrawer/ModularDrawerAddAccountFlowManager";
import { aleoCurrency } from "../__mocks__/currency.mock";

beforeEach(async () => {
  mockDomMeasurements();
});

const mockAppState = {
  device: { modelId: "stax" },
  onResult: () => true,
  isLocked: false,
  opened: true,
};

const mockNavigate = jest.fn();

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/hw/actions/app", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/actions/app"),
  createAction: () => ({
    useHook: () => mockAppState,
    mapResult: () => ({ device: { deviceId: 123456 } }),
  }),
}));

jest.mock("~/renderer/reducers/devices", () => {
  return {
    __esModule: true,
    ...jest.requireActual("~/renderer/reducers/devices"),
    getCurrentDevice: jest.fn(() => mockAppState.device),
  };
});

jest.mock("~/renderer/animations", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("react-router", () => ({
  __esModule: true,
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const setup = (state?: Partial<State>) => {
  const initialState = {
    ...state,
    modularDrawer: {
      source: "MADSource",
      flow: "Add account",
      ...state?.modularDrawer,
    },
  };

  return render(<ModularDrawerAddAccountFlowManager currency={aleoCurrency} />, { initialState });
};

describe("ModularDrawerAddAccountFlowManager", () => {
  beforeEach(() => {
    setEnv("EXPERIMENTAL_CURRENCIES", "aleo");
  });

  it("should render warning step", async () => {
    setup();

    expect(screen.getByText(/view key warning step/i)).toBeInTheDocument();
  });
});
