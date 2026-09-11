import { renderHook } from "tests/testSetup";
import { useContactDetailActionParam } from "../useContactDetailActionParam";

const mockSetSearchParams = jest.fn();
let currentParams = new URLSearchParams();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useSearchParams: () => [currentParams, mockSetSearchParams],
}));

type TestContact = Readonly<{ id: string }>;

const contact: TestContact = { id: "contact-ada" };

describe("useContactDetailActionParam", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentParams = new URLSearchParams();
  });

  it("runs the matching handler and strips the action param", () => {
    currentParams = new URLSearchParams("action=add-address");
    const addAddress = jest.fn();

    renderHook(() => useContactDetailActionParam(contact, { "add-address": addAddress }));

    expect(addAddress).toHaveBeenCalledTimes(1);
    expect(addAddress).toHaveBeenCalledWith(contact);
    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
  });

  it("waits for the contact before running the handler", () => {
    currentParams = new URLSearchParams("action=add-address");
    const addAddress = jest.fn();

    const { rerender } = renderHook<void, { target: TestContact | undefined }>(
      ({ target }) => useContactDetailActionParam(target, { "add-address": addAddress }),
      { initialProps: { target: undefined } },
    );

    expect(addAddress).not.toHaveBeenCalled();

    rerender({ target: contact });

    expect(addAddress).toHaveBeenCalledTimes(1);
    expect(addAddress).toHaveBeenCalledWith(contact);
  });

  it("ignores an unknown action", () => {
    currentParams = new URLSearchParams("action=unknown");
    const addAddress = jest.fn();

    renderHook(() => useContactDetailActionParam(contact, { "add-address": addAddress }));

    expect(addAddress).not.toHaveBeenCalled();
    expect(mockSetSearchParams).not.toHaveBeenCalled();
  });

  it("does nothing without an action param", () => {
    const addAddress = jest.fn();

    renderHook(() => useContactDetailActionParam(contact, { "add-address": addAddress }));

    expect(addAddress).not.toHaveBeenCalled();
    expect(mockSetSearchParams).not.toHaveBeenCalled();
  });
});
