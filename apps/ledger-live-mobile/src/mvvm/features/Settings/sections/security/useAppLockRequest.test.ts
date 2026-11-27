import { renderHook } from "@tests/test-renderer";
import { useAppLockRequest } from "./useAppLockRequest";

describe("useAppLockRequest", () => {
  it("sets the password for a set request and removes it for a remove request", () => {
    const onPasswordChange = jest.fn();
    const { result } = renderHook(() => useAppLockRequest(onPasswordChange));

    result.current("set");
    result.current("remove");

    expect(onPasswordChange.mock.calls).toEqual([[true], [false]]);
  });

  it("ignores a change request: mobile has no Change password row", () => {
    const onPasswordChange = jest.fn();
    const { result } = renderHook(() => useAppLockRequest(onPasswordChange));

    result.current("change");

    expect(onPasswordChange).not.toHaveBeenCalled();
  });
});
