import { toReceiveReadFailure } from "./toReceiveReadFailure";

const READ = { failed: false, error: undefined };
const SYNC_FAILED = { name: "NetworkDown", message: "sync failed" };
const STATUS_FAILED = { name: "HttpError", message: "status unavailable" };

describe("toReceiveReadFailure", () => {
  it("should name the account alone, with no read error, when the account model does not hold it", () => {
    expect(
      toReceiveReadFailure(false, { receive: READ, accountStatus: READ, assetStatus: READ }),
    ).toEqual({ failedKinds: ["account"], readError: undefined });
  });

  it("should list the failed kinds in read order, with the error of the first one", () => {
    expect(
      toReceiveReadFailure(true, {
        receive: { failed: true, error: SYNC_FAILED },
        accountStatus: READ,
        assetStatus: { failed: true, error: STATUS_FAILED },
      }),
    ).toEqual({ failedKinds: ["receive", "assetStatus"], readError: SYNC_FAILED });
  });

  it("should ignore the error of a kind that still holds its data", () => {
    expect(
      toReceiveReadFailure(true, {
        receive: { failed: false, error: SYNC_FAILED },
        accountStatus: { failed: true, error: STATUS_FAILED },
        assetStatus: READ,
      }),
    ).toEqual({ failedKinds: ["accountStatus"], readError: STATUS_FAILED });
  });
});
