import { renderHook } from "@testing-library/react-native";
import { useReceiveNoahEntry } from "./useNoahEntryPoint";
import * as featureFlags from "@ledgerhq/live-common/featureFlags/index";
import * as reactNavigationCore from "@react-navigation/core";
import ReceiveFundsOptions from "~/screens/ReceiveFundsOptions";

jest.mock("@ledgerhq/live-common/featureFlags/index");
jest.mock("@react-navigation/core");
jest.mock("~/screens/ReceiveFundsOptions", () => jest.fn(() => null));

const mockedUseFeature = jest.mocked(featureFlags.useFeature);
const mockedUseRoute = jest.mocked(reactNavigationCore.useRoute);

describe("useReceiveNoahEntry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns {} when the feature flag is disabled", () => {
    mockedUseFeature.mockReturnValue({ enabled: false });
    mockedUseRoute.mockReturnValue({ params: {}, key: "", name: "" });

    const { result } = renderHook(() => useReceiveNoahEntry());

    expect(result.current).toEqual({});
  });

  it("returns {} when the route makes shouldShowNoahMenu return false", () => {
    mockedUseFeature.mockReturnValue({ enabled: true });
    mockedUseRoute.mockReturnValue({
      params: { params: { currency: { id: "bitcoin", family: "bitcoin" } } },
      key: "",
      name: "",
    });

    const { result } = renderHook(() => useReceiveNoahEntry());

    expect(result.current).toEqual({});
  });

  it("returns component + options when shouldShowNoahMenu resolves true", () => {
    mockedUseFeature.mockReturnValue({ enabled: true });
    mockedUseRoute.mockReturnValue({
      params: { params: {} },
      key: "",
      name: "",
    });

    const { result } = renderHook(() => useReceiveNoahEntry());

    expect(result.current).toHaveProperty("component", ReceiveFundsOptions);
    expect(result.current).toHaveProperty("options");
  });
});
