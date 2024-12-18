import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react-hooks";
import { Observable } from "rxjs";
import type { Device } from "./types";
import { createAction, type ExchangeRequestEvent } from "./completeExchange";
import { Transaction } from "../../generated/types";
import { Exchange } from "../../exchange/types";
import { genAccount } from "../../mock/account";
import { DeviceModelId } from "@ledgerhq/devices";
import { DisconnectedDeviceDuringOperation } from "@ledgerhq/errors";

type CompleteExchangeActionRequest = {
  device?: Device;
  provider: string;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  exchange: Exchange;
  exchangeType: number;
  rateType?: number;
  swapId?: string;
  rate?: number;
  amountExpectedTo?: number;
};

describe("createAction", () => {
  describe("useHook", () => {
    const completeExchangeRequest = {
      deviceId: undefined,
      provider: "provider",
      transaction: {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("0"),
        recipient: "recipient",
      } as Transaction,
      binaryPayload: "binaryPayload",
      signature: "signature",
      exchange: {
        fromAccount: genAccount("seed"),
        fromParentAccount: null,
        toAccount: genAccount("seed"),
        toParentAccount: null,
      },
      exchangeType: 0,
    };

    it("returns the device ", () => {
      // Given
      const device: Device = {
        deviceId: "deviceId",
        deviceName: "Device Name",
        modelId: DeviceModelId.blue,
        wired: true,
      };

      // When
      const { result } = renderHook(() => {
        const exchange = (_req: CompleteExchangeActionRequest): Observable<ExchangeRequestEvent> =>
          new Observable(sub => sub.complete());

        return createAction(exchange).useHook(device, completeExchangeRequest);
      });

      // Then
      expect(result.current.device).toEqual(device);
    });

    it("returns an error if completeExchangeExec returns one", () => {
      // Given
      const device = null;

      // When
      const { result } = renderHook(() => {
        const exchange = (_req: CompleteExchangeActionRequest): Observable<ExchangeRequestEvent> =>
          new Observable(sub => {
            sub.next({
              type: "complete-exchange-error",
              error: new DisconnectedDeviceDuringOperation(),
            });
            sub.complete();
          });

        return createAction(exchange).useHook(device, completeExchangeRequest);
      });

      // Then
      expect(result.current.completeExchangeError).toEqual(new DisconnectedDeviceDuringOperation());
    });
  });
});
