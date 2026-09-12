import { exportWalletState, initialState } from "~/renderer/reducers/wallet";
import { getKey } from "~/renderer/storage";
import { fetchWallet } from "./wallet";

jest.mock("~/renderer/storage", () => ({
  getKey: jest.fn(),
}));

describe("fetchWallet", () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should import a persisted wallet", async () => {
    jest.mocked(getKey).mockResolvedValue({
      status: "available",
      data: exportWalletState(initialState),
    });

    await fetchWallet()(dispatch, jest.fn(), undefined);

    expect(getKey).toHaveBeenCalledWith("app", "wallet");
    expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should not dispatch when the persisted wallet is encrypted", async () => {
    jest.mocked(getKey).mockResolvedValue({ status: "encrypted" });

    await fetchWallet()(dispatch, jest.fn(), undefined);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should not dispatch when the persisted wallet is missing", async () => {
    jest.mocked(getKey).mockResolvedValue({ status: "available", data: null });

    await fetchWallet()(dispatch, jest.fn(), undefined);

    expect(dispatch).not.toHaveBeenCalled();
  });
});
