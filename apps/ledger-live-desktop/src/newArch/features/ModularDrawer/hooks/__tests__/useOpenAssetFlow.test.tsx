import { useOpenAssetFlow } from "../useOpenAssetFlow";
import { ModularLocation } from "../../enums";
import { useModularDrawerVisibility } from "../useModularDrawerVisibility";

import { selectCurrency } from "../../utils/selectCurrency";
import { Wrapper } from "./shared";
import { useDispatch } from "react-redux";
import { renderHook } from "@testing-library/react";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));
jest.mock("../useModularDrawerVisibility", () => ({
  useModularDrawerVisibility: jest.fn(),
}));
jest.mock("../../utils/selectCurrency", () => ({
  selectCurrency: jest.fn(),
}));

const mockDispatch = jest.fn();
(useDispatch as jest.Mock).mockReturnValue(mockDispatch);

const mockIsModularDrawerVisible = jest.fn();
(useModularDrawerVisibility as jest.Mock).mockReturnValue({
  isModularDrawerVisible: mockIsModularDrawerVisible,
});

const mockSelectCurrency = jest.fn();
(selectCurrency as jest.Mock).mockImplementation(mockSelectCurrency);

describe("useOpenAssetFlow", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const modularLocation = ModularLocation.ADD_ACCOUNT;
  it("should call selectCurrency if the modular drawer is visible", async () => {
    mockIsModularDrawerVisible.mockReturnValue(true);

    const { result } = renderHook(() => useOpenAssetFlow(modularLocation), {
      wrapper: Wrapper,
    });

    await result.current.openAssetFlow();

    expect(mockIsModularDrawerVisible).toHaveBeenCalledWith(modularLocation);
    expect(mockSelectCurrency).toHaveBeenCalled();
  });

  it("should dispatch openModal if the modular drawer is not visible", async () => {
    mockIsModularDrawerVisible.mockReturnValue(false);

    const { result } = renderHook(() => useOpenAssetFlow(modularLocation), {
      wrapper: Wrapper,
    });

    await result.current.openAssetFlow();

    expect(mockIsModularDrawerVisible).toHaveBeenCalledWith(modularLocation);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "MODAL_OPEN",
      payload: {
        name: "MODAL_ADD_ACCOUNTS",
        data: undefined,
      },
    });
  });
});
