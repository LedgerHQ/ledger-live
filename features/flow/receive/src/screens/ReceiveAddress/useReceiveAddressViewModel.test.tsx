import { renderHook, waitFor } from "@testing-library/react";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { receiveTestWrapper, testAccountUUID, testReceive } from "../../__tests__/receiveTestStore";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";
import { useReceiveAddressViewModel } from "./useReceiveAddressViewModel";

jest.mock("./useReceiveAddressHeader", () => {
  const actual = jest.requireActual("./useReceiveAddressHeader");
  return { ...actual, useReceiveAddressHeader: jest.fn(actual.useReceiveAddressHeader) };
});

const ETH = CryptoOrTokenCurrencyIdSchema.parse("ethereum");

describe("useReceiveAddressViewModel", () => {
  it("should show the address read even when the asset metadata is unknown", async () => {
    const { useReceiveAddressHeader: actualHeader } = jest.requireActual(
      "./useReceiveAddressHeader",
    );
    jest.mocked(useReceiveAddressHeader).mockImplementation((descriptor, assetId) => ({
      ...actualHeader(descriptor, assetId),
      data: undefined,
    }));

    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
        }),
      { wrapper: receiveTestWrapper() },
    );

    await waitFor(() => expect(result.current.address?.value).toBe(testReceive.address));
    expect(result.current.address?.assetIcon).toBeUndefined();
  });

  it("should list the labels of the actions the app gives", () => {
    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
          onCopyAddress: jest.fn(),
        }),
      { wrapper: receiveTestWrapper() },
    );

    expect(result.current.actionsPlaceholderLabel).toBe("Copy");
  });
});
