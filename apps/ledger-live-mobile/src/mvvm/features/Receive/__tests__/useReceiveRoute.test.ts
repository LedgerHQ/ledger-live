import { renderHook } from "@tests/test-renderer";
import { getReceiveRoute } from "../utils/getReceiveRoute";
import { useReceiveRoute } from "../hooks/useReceiveRoute";

jest.mock("~/rootnavigation", () => ({
  navigationRef: { current: { getCurrentRoute: () => ({ name: "Account" }) } },
}));
jest.mock("../utils/getReceiveRoute", () => ({ getReceiveRoute: jest.fn() }));

describe("useReceiveRoute", () => {
  it("should give the receive route the screen the user opens it from", () => {
    const { result } = renderHook(() => useReceiveRoute());

    result.current({ accountId: "js:2:ethereum:0xabc:" });

    expect(getReceiveRoute).toHaveBeenCalledWith(
      { accountId: "js:2:ethereum:0xabc:" },
      expect.anything(),
      "Account",
    );
  });
});
