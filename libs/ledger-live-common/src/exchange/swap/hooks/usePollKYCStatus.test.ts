import { renderHook } from "@testing-library/react-hooks";
import {
  usePollKYCStatus,
  KYC_STATUS_POLLING_INTERVAL,
} from "./usePollKYCStatus";
import type { UsePollKYCStatusProps } from "./usePollKYCStatus";
import { KYC_STATUS } from "../utils";
import { getKYCStatus } from "..";
import { KYCStatus } from "../types";

// mock getKYCStatus
jest.mock("..");
const mockedGetKYCStatus = jest.mocked(getKYCStatus, true);

describe("usePollKYCStatus", () => {
  const defaultInput: UsePollKYCStatusProps = {
    provider: "changelly",
    kyc: { id: "1", status: KYC_STATUS.pending },
    onChange: () => {},
  };

  beforeEach(() => {
    mockedGetKYCStatus.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("KYC status isn't fetched when the local status isn't PENDING", () => {
    Object.values(KYC_STATUS)
      .filter((status) => status !== "pending")
      .forEach((status) => {
        const input = { ...defaultInput, kyc: { id: "1", status } };
        renderHook(() => usePollKYCStatus(input));
        expect(mockedGetKYCStatus).toHaveBeenCalledTimes(0);
      });
  });

  test("onChange isn't triggered when the local/remote status are equals", () => {
    const onChange = jest.fn();
    const input = { ...defaultInput, onChange };

    const fetchedValue: KYCStatus = { status: "pending", id: "1" };
    mockedGetKYCStatus.mockResolvedValueOnce(fetchedValue);

    renderHook(() => usePollKYCStatus(input));
    expect(mockedGetKYCStatus).toHaveBeenCalledTimes(1);
    expect(mockedGetKYCStatus).toHaveBeenCalledWith(
      input.provider,
      input.kyc.id
    );
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  test("onChange is triggered when the local/remote status are different", () => {
    const onChange = jest.fn();
    const input = { ...defaultInput, onChange };

    const fetchedValue: KYCStatus = { status: "approved", id: "1" };
    mockedGetKYCStatus.mockResolvedValueOnce(fetchedValue);

    const { waitFor } = renderHook(() => usePollKYCStatus(input));
    expect(mockedGetKYCStatus).toHaveBeenCalledTimes(1);
    waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  });

  test("setInterval retriggers the updateKYCStatus function", () => {
    const onChange = jest.fn();
    const input = { ...defaultInput, onChange };

    const fetchedValue: KYCStatus = { status: "approved", id: "1" };
    mockedGetKYCStatus.mockResolvedValue(fetchedValue);

    const { waitFor } = renderHook(() => usePollKYCStatus(input));
    waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    waitFor(() => expect(mockedGetKYCStatus).toHaveBeenCalledTimes(1));

    // manually trigger the setInterval
    jest.advanceTimersByTime(KYC_STATUS_POLLING_INTERVAL);

    waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    waitFor(() => expect(mockedGetKYCStatus).toHaveBeenCalledTimes(2));
  });
});
