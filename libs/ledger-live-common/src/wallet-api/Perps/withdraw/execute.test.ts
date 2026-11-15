import BigNumber from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/devices";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import type { Device } from "../../../hw/actions/types";
import { submitWithdraw } from "./api";
import {
  WithdrawApiError,
  WithdrawSignerMismatchError,
  WithdrawSubmitUnknownOutcomeError,
  WithdrawUnsupportedRouteError,
} from "./errors";
import { executePerpsWithdraw, isPerpsWithdrawRetryable } from "./execute";
import type { WithdrawQuote } from "./quote";
import { beginWithdrawRequest, cancelWithdrawRequest, getWithdrawRequestId } from "./request";
import { WithdrawPayloadSchema } from "./schemas";
import { signWithdrawTypedData } from "./sign";
import { nearWithdrawPayload, submitResponse } from "./__fixtures__/responses";

jest.mock("./api");
jest.mock("./sign", () => ({
  ...jest.requireActual("./sign"),
  signWithdrawTypedData: jest.fn(),
}));

const mockedSign = jest.mocked(signWithdrawTypedData);
const mockedSubmit = jest.mocked(submitWithdraw);

const device: Device = { deviceId: "device-1", modelId: DeviceModelId.nanoX, wired: false };
const sourceAccount = {
  id: "hypercore-account",
  type: "Account",
  currency: getCryptoCurrencyById("hypercore"),
} as Account;
const track = jest.fn();
const properties = {
  page: "perps_withdraw_sign",
  flow: "perps",
  flowInitiatedFrom: "Perps",
  sourceCurrency: "USDC",
  targetCurrency: "ETH",
};
const payload = WithdrawPayloadSchema.parse(nearWithdrawPayload);
const quote: WithdrawQuote = {
  amountTo: new BigNumber("0.045"),
  payoutNetworkFees: new BigNumber(0),
  expiry: 0,
  payload,
};
const result = { amountFrom: "115.62", amountTo: "0.045", toCurrencyId: "ethereum" };

describe("executePerpsWithdraw", () => {
  let request: Promise<unknown>;

  const execute = (overrides: Partial<Parameters<typeof executePerpsWithdraw>[0]> = {}) =>
    executePerpsWithdraw({
      requestId: getWithdrawRequestId(),
      device,
      sourceAccount,
      quote,
      result,
      targetCurrency: "ETH",
      track,
      ...overrides,
    });

  beforeEach(() => {
    jest.resetAllMocks();
    request = beginWithdrawRequest();
    // The tests that reject the request read it; the others never do.
    request.catch(() => undefined);
  });

  afterEach(() => cancelWithdrawRequest());

  it("submits the unmodified payload with its signature and settles the request", async () => {
    const onSigned = jest.fn();
    mockedSign.mockResolvedValueOnce("0xsignature");
    mockedSubmit.mockResolvedValueOnce(submitResponse);

    await expect(execute({ onSigned })).resolves.toEqual({
      ...result,
      swapId: submitResponse.swapId,
    });
    expect(onSigned).toHaveBeenCalledTimes(1);
    expect(mockedSubmit).toHaveBeenCalledWith({ payload, signature: "0xsignature" });
    await expect(request).resolves.toEqual({ ...result, swapId: submitResponse.swapId });
    expect(mockedSign).toHaveBeenCalledWith(device, sourceAccount, expect.anything(), {
      track,
      properties,
    });
    expect(track.mock.calls).toEqual([
      ["Perps withdraw submitted", properties],
      ["Perps withdraw completed", { ...properties, swapId: submitResponse.swapId }],
    ]);
  });

  it("keeps the request pending when signing fails, so it can be retried", async () => {
    mockedSign.mockRejectedValueOnce(new UserRefusedOnDevice());

    await expect(execute()).rejects.toThrow(UserRefusedOnDevice);
    expect(mockedSubmit).not.toHaveBeenCalled();
    expect(getWithdrawRequestId()).not.toBeNull();
  });

  it("submits nothing once the request was cancelled while the device signed", async () => {
    mockedSign.mockImplementationOnce(async () => {
      cancelWithdrawRequest();
      return "0xsignature";
    });

    await expect(execute()).rejects.toThrow(UserRefusedOnDevice);
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it("rejects the request when the submit outcome is unknown", async () => {
    const error = new WithdrawSubmitUnknownOutcomeError("Bad gateway", { status: 502 });
    mockedSign.mockResolvedValueOnce("0xsignature");
    mockedSubmit.mockRejectedValueOnce(error);

    await expect(execute()).rejects.toBe(error);
    await expect(request).rejects.toBe(error);
    expect(track.mock.calls).toEqual([
      ["Perps withdraw submitted", properties],
      ["Perps withdraw submit failed", properties],
    ]);
  });

  it("signs nothing when the quote carries no payload", async () => {
    await expect(execute({ quote: { ...quote, payload: undefined } })).rejects.toThrow(
      WithdrawApiError,
    );
    expect(mockedSign).not.toHaveBeenCalled();
  });
});

describe("isPerpsWithdrawRetryable", () => {
  it("retries a device error but never a submit error or an unsignable payload", () => {
    expect(isPerpsWithdrawRetryable(new Error("Locked device"))).toBe(true);
    expect(isPerpsWithdrawRetryable(new WithdrawSubmitUnknownOutcomeError())).toBe(false);
    expect(isPerpsWithdrawRetryable(new WithdrawUnsupportedRouteError())).toBe(false);
    expect(isPerpsWithdrawRetryable(new WithdrawSignerMismatchError())).toBe(false);
  });
});
