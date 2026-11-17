import { renderHook } from "@testing-library/react";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { trackPage } from "@shared/analytics";
import { toReceiveAddressTracking } from "./receiveAddressTracking";
import { useReceiveAddressPageEvent } from "./useReceiveAddressPageEvent";

jest.mock("@shared/analytics", () => ({ trackPage: jest.fn() }));

const params = {
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
  descriptor: mockAddressAccountDescriptor(),
  isVerified: false,
  isVerifyPopoverDisplayed: true,
  canVerifyOnDevice: true,
  isTokenAssociationRequired: false,
  tracking: toReceiveAddressTracking("Account Page"),
};

describe("useReceiveAddressPageEvent", () => {
  beforeEach(() => jest.mocked(trackPage).mockClear());

  it("sends the page once the address is shown, with the screen's state and its entry point", () => {
    const { rerender } = renderHook(
      ({ shownKey }: { shownKey?: string }) => useReceiveAddressPageEvent({ ...params, shownKey }),
      { initialProps: {} },
    );
    expect(trackPage).not.toHaveBeenCalled();

    rerender({ shownKey: "0x71C7" });
    rerender({ shownKey: "0x71C7" });

    expect(trackPage).toHaveBeenCalledTimes(1);
    expect(trackPage).toHaveBeenCalledWith({
      category: "Receive - Confirmation",
      props: {
        asset: "ethereum",
        network: "ethereum",
        isVerified: false,
        isVerifyPopoverDisplayed: true,
        canVerifyOnDevice: true,
        isTokenAssociationRequired: false,
        page: "Receive - Confirmation",
        flow: "receive",
        source: "Account Page",
      },
    });
  });

  it("sends the page again for another address", () => {
    const { rerender } = renderHook(
      ({ shownKey }: { shownKey?: string }) => useReceiveAddressPageEvent({ ...params, shownKey }),
      { initialProps: { shownKey: "t1transparent" } },
    );

    rerender({ shownKey: "u1shielded" });

    expect(trackPage).toHaveBeenCalledTimes(2);
  });
});
