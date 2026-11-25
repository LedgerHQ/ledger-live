import { act, renderHook, waitFor } from "@testing-library/react";
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

  it("should list the notices", async () => {
    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
          getFamilyConfig: () => ({ notices: ["utxo"] }),
        }),
      { wrapper: receiveTestWrapper() },
    );

    await waitFor(() => expect(result.current.notices.map(notice => notice.id)).toEqual(["utxo"]));
  });

  it("should show the service incident before the address, until the user continues", async () => {
    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
          serviceIncidents: [
            { title: "Ethereum degraded", description: [{ text: "Investigating" }] },
          ],
        }),
      { wrapper: receiveTestWrapper() },
    );

    expect(result.current.serviceStatus).toEqual(
      expect.objectContaining({
        title: "Ethereum degraded",
        description: [{ text: "Investigating" }],
      }),
    );

    act(() => result.current.serviceStatus?.onContinue());

    expect(result.current.serviceStatus).toBeUndefined();
    await waitFor(() => expect(result.current.address).toBeDefined());
  });
});
