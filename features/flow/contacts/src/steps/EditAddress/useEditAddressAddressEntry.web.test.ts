import { act, renderHook } from "@testing-library/react";
import { ContactAddressValueSchema } from "@domain/entity-contact";
import { mockContactAddress } from "@domain/entity-contact/schema.mock";
import type { ContactsAddressValidationPort } from "@features/platform-contacts";
import { useEditAddressAddressEntry } from "./useEditAddressAddressEntry";

describe("useEditAddressAddressEntry", () => {
  const mockAddress = mockContactAddress();
  const currentAddress = mockAddress.address;
  const currencyId = mockAddress.currencyId;
  const validAddress = ContactAddressValueSchema.parse(
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  );

  function createDeferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(res => {
      resolve = res;
    });

    return { promise, resolve };
  }

  function createValidationPort(
    validateAddress: ContactsAddressValidationPort["validateAddress"],
  ): ContactsAddressValidationPort {
    return { validateAddress };
  }

  it("should recover to valid after an invalid address edit", async () => {
    const validateAddress = jest
      .fn<
        ReturnType<ContactsAddressValidationPort["validateAddress"]>,
        Parameters<ContactsAddressValidationPort["validateAddress"]>
      >()
      .mockResolvedValueOnce({ status: "invalid_format", isDomain: false })
      .mockResolvedValueOnce({ status: "valid", resolvedAddress: validAddress, isDomain: false });
    const { result } = renderHook(() =>
      useEditAddressAddressEntry({
        addressValidation: createValidationPort(validateAddress),
        currencyId,
        currentAddress,
        isActive: true,
      }),
    );

    await act(async () => {
      result.current.onAddressChange("invalid-address", "manual");
    });

    expect(result.current.addressEntry).toMatchObject({
      status: "invalid",
      value: "invalid-address",
    });

    await act(async () => {
      result.current.onAddressChange(validAddress, "manual");
      await Promise.resolve();
    });

    expect(result.current.addressEntry).toMatchObject({
      status: "valid",
      value: validAddress,
      resolvedAddress: validAddress,
    });
  });

  it("should ignore stale validation results for outdated input values", async () => {
    const deferredValidation =
      createDeferred<Awaited<ReturnType<ContactsAddressValidationPort["validateAddress"]>>>();
    const validateAddress = jest
      .fn<
        ReturnType<ContactsAddressValidationPort["validateAddress"]>,
        Parameters<ContactsAddressValidationPort["validateAddress"]>
      >()
      .mockReturnValueOnce(deferredValidation.promise)
      .mockResolvedValueOnce({ status: "valid", resolvedAddress: validAddress, isDomain: false });
    const { result } = renderHook(() =>
      useEditAddressAddressEntry({
        addressValidation: createValidationPort(validateAddress),
        currencyId,
        currentAddress,
        isActive: true,
      }),
    );

    act(() => {
      result.current.onAddressChange("invalid-address", "manual");
    });

    act(() => {
      result.current.onAddressChange(validAddress, "manual");
    });

    await act(async () => {
      deferredValidation.resolve({ status: "invalid_format", isDomain: false });
      await Promise.resolve();
    });

    expect(result.current.addressEntry).toMatchObject({
      status: "valid",
      value: validAddress,
      resolvedAddress: validAddress,
    });
  });

  it("should restore the initial valid state when the saved address is re-entered", async () => {
    const validateAddress = jest
      .fn<
        ReturnType<ContactsAddressValidationPort["validateAddress"]>,
        Parameters<ContactsAddressValidationPort["validateAddress"]>
      >()
      .mockResolvedValue({ status: "invalid_format", isDomain: false });
    const { result } = renderHook(() =>
      useEditAddressAddressEntry({
        addressValidation: createValidationPort(validateAddress),
        currencyId,
        currentAddress,
        isActive: true,
      }),
    );

    await act(async () => {
      result.current.onAddressChange("invalid-address", "manual");
    });

    await act(async () => {
      result.current.onAddressChange(currentAddress, "manual");
    });

    expect(validateAddress).toHaveBeenCalledTimes(1);
    expect(validateAddress).toHaveBeenCalledWith({
      currencyId,
      address: "invalid-address",
    });
    expect(result.current.addressEntry).toMatchObject({
      status: "valid",
      value: currentAddress,
      resolvedAddress: currentAddress,
    });
  });

  it("should keep the input editable when currencyId is missing", () => {
    const { result } = renderHook(() =>
      useEditAddressAddressEntry({
        currencyId: undefined,
        currentAddress,
        isActive: true,
      }),
    );

    act(() => {
      result.current.onAddressChange("0xpending", "manual");
    });

    expect(result.current.addressEntry).toMatchObject({
      status: "unavailable",
      value: "0xpending",
      inputMethod: "manual",
    });
  });

  it("should initialize when currentAddress becomes available after open", () => {
    const { result, rerender } = renderHook(
      ({ currentAddress: nextAddress }) =>
        useEditAddressAddressEntry({
          currencyId,
          currentAddress: nextAddress,
          isActive: true,
        }),
      { initialProps: { currentAddress: undefined as typeof currentAddress | undefined } },
    );

    expect(result.current.addressEntry).toMatchObject({
      status: "empty",
      value: "",
    });

    rerender({ currentAddress });

    expect(result.current.addressEntry).toMatchObject({
      status: "valid",
      value: currentAddress,
      resolvedAddress: currentAddress,
    });
  });
});
