import React from "react";
import { setEnv } from "@ledgerhq/live-env";
import { render, screen, userEvent } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
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

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  ...jest.requireActual("~/renderer/linking"),
  openURL: jest.fn(),
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

function expectTrackPage(
  n: number,
  page: string,
  props: { flow?: string; reason?: string } = {},
  source = "MADSource",
) {
  expect(trackPage).toHaveBeenNthCalledWith(n, page, undefined, { ...props, source }, true, true);
}

describe("ModularDrawerAddAccountFlowManager", () => {
  beforeEach(() => {
    jest.mocked(track).mockReset();
    jest.mocked(trackPage).mockReset();
    setEnv("EXPERIMENTAL_CURRENCIES", "aleo");
  });

  it("should render warning step", async () => {
    setup();

    expectTrackPage(2, "confirm view key warning", { flow: "Add account" });
    expect(screen.getByText(/set up aleo private balance/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Allow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    const learnMoreLink = screen.getByTestId("learn-more-link");
    await userEvent.click(learnMoreLink);

    expect(openURL).toHaveBeenCalledTimes(1);
  });
});
