import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import {
  DeviceAppVerifyNotSupported,
  UserRefusedAddress,
  UserRefusedOnDevice,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { mapGetAddressError } from "../getAddressVerification";

describe("mapGetAddressError", () => {
  it("maps device refusals to refused", () => {
    expect(mapGetAddressError(new UserRefusedAddress())).toEqual({ type: "refused" });
    expect(mapGetAddressError(new UserRefusedOnDevice())).toEqual({ type: "refused" });
    expect(
      mapGetAddressError(new TransportStatusError(StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED)),
    ).toEqual({ type: "refused" });
    expect(
      mapGetAddressError(new TransportStatusError(StatusCodes.USER_REFUSED_ON_DEVICE)),
    ).toEqual({ type: "refused" });
    expect(
      mapGetAddressError(
        Object.assign(new Error("other"), {
          statusCode: StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED,
        }),
      ),
    ).toEqual({ type: "refused" });
  });

  it("maps DeviceAppVerifyNotSupported to unsupported", () => {
    const error = new DeviceAppVerifyNotSupported();

    expect(mapGetAddressError(error)).toEqual({ type: "unsupported", error });
  });

  it("leaves other errors unmapped", () => {
    expect(mapGetAddressError(new TransportStatusError(0x6a80))).toBeUndefined();
  });
});
