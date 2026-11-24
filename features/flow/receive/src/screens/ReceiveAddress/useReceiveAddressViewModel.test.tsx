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

  it("should list the service warning, then the notices", async () => {
    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
          getFamilyConfig: () => ({ notices: ["utxo"] }),
          serviceIncidents: [{ title: "Ethereum degraded" }],
        }),
      { wrapper: receiveTestWrapper() },
    );

    await waitFor(() =>
      expect(result.current.noticesPlaceholderLabel).toMatch(/^Ethereum degraded · ./),
    );
  });

  it("should open the incidents from the warning, then close them", async () => {
    const { result } = renderHook(
      () =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
          serviceIncidents: [{ title: "Ethereum degraded", description: "Investigating" }],
        }),
      { wrapper: receiveTestWrapper() },
    );

    await waitFor(() => expect(result.current.serviceWarning).toBeDefined());
    act(() => result.current.serviceWarning?.onPress());
    expect(result.current.serviceStatus?.incidents).toEqual([
      { title: "Ethereum degraded", description: "Investigating" },
    ]);

    act(() => result.current.serviceStatus?.onClose());
    expect(result.current.serviceStatus).toBeUndefined();
  });

  it("should keep the incidents closed once resolved, even when new ones arrive", async () => {
    const { result, rerender } = renderHook(
      ({ incidents }: { incidents: { title: string }[] }) =>
        useReceiveAddressViewModel({
          accountUUID: testAccountUUID,
          assetId: ETH,
          onClose: jest.fn(),
          serviceIncidents: incidents,
        }),
      {
        wrapper: receiveTestWrapper(),
        initialProps: { incidents: [{ title: "Ethereum degraded" }] },
      },
    );

    await waitFor(() => expect(result.current.serviceWarning).toBeDefined());
    act(() => result.current.serviceWarning?.onPress());
    rerender({ incidents: [] });

    expect(result.current.serviceStatus).toBeUndefined();

    rerender({ incidents: [{ title: "Ethereum degraded again" }] });

    expect(result.current.serviceStatus).toBeUndefined();
  });
});
