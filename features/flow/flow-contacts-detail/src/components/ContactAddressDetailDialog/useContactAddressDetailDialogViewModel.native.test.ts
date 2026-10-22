import { act, renderHook, waitFor } from "@testing-library/react-native";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { createContactDetailAddressRowIntent } from "../../model/viewModel";
import { useContactAddressDetailDialogViewModel } from "./useContactAddressDetailDialogViewModel.native";

function createSelection() {
  const contact = mockContact({
    id: "contact-ben",
    name: "Ben",
    addresses: [mockContactAddress({ id: "address-ethereum", currencyId: "ethereum" })],
  });
  const address = contact.addresses[0]!;
  const row = {
    addressId: address.id,
    label: address.label,
    address: address.address,
    currencyId: address.currencyId,
    intent: createContactDetailAddressRowIntent(contact.id, address.id),
  };
  const network = {
    networkId: getCryptoCurrencyById("ethereum").id,
    networkName: getCryptoCurrencyById("ethereum").name,
    networkTicker: getCryptoCurrencyById("ethereum").ticker,
    rows: [row],
  };

  return { row, network };
}

describe("useContactAddressDetailDialogViewModel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should expose selection state when the dialog is open with a row and network", () => {
    const { row, network } = createSelection();
    const { result } = renderHook(() =>
      useContactAddressDetailDialogViewModel({
        isOpen: true,
        row,
        network,
      }),
    );

    expect(result.current.hasSelection).toBe(true);
    expect(result.current.hasCopied).toBe(false);
  });

  it("should copy the address and show copied feedback", async () => {
    const { row, network } = createSelection();
    const onCopyAddress = jest.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useContactAddressDetailDialogViewModel({
        isOpen: true,
        row,
        network,
        onCopyAddress,
      }),
    );

    await act(async () => {
      await result.current.onCopy();
    });

    expect(onCopyAddress).toHaveBeenCalledWith("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
    expect(result.current.hasCopied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.hasCopied).toBe(false);
    });
  });

  it("should not show copied feedback when the copy failed", async () => {
    const { row, network } = createSelection();
    const onCopyAddress = jest.fn().mockResolvedValue(false);
    const { result } = renderHook(() =>
      useContactAddressDetailDialogViewModel({
        isOpen: true,
        row,
        network,
        onCopyAddress,
      }),
    );

    await act(async () => {
      await result.current.onCopy();
    });

    expect(onCopyAddress).toHaveBeenCalledTimes(1);
    expect(result.current.hasCopied).toBe(false);
  });

  it("should not show copied feedback when no copy handler is provided", async () => {
    const { row, network } = createSelection();
    const { result } = renderHook(() =>
      useContactAddressDetailDialogViewModel({
        isOpen: true,
        row,
        network,
      }),
    );

    await act(async () => {
      await result.current.onCopy();
    });

    expect(result.current.hasCopied).toBe(false);
  });

  it("should reset copied feedback when the dialog closes", async () => {
    const { row, network } = createSelection();
    const onCopyAddress = jest.fn().mockResolvedValue(true);
    const { result, rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) =>
        useContactAddressDetailDialogViewModel({
          isOpen,
          row,
          network,
          onCopyAddress,
        }),
      { initialProps: { isOpen: true } },
    );

    await act(async () => {
      await result.current.onCopy();
    });

    expect(result.current.hasCopied).toBe(true);

    rerender({ isOpen: false });
    rerender({ isOpen: true });

    expect(result.current.hasCopied).toBe(false);
  });
});
