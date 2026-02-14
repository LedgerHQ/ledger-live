import { RefObject } from "react";
import {
  ethereumCurrency,
  bitcoinCurrency,
  arbitrumCurrency,
} from "../__mocks__/useSelectAssetFlow.mock";

export const mockOnAccountSelected = jest.fn();
export const mockOnAssetSelected = jest.fn();
export const mockDispatch = jest.fn();
export const currencies = [ethereumCurrency, bitcoinCurrency, arbitrumCurrency];

export function mockDomMeasurements() {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 800,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 800,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    };
  };
}

export function setRefCurrent<T>(ref: RefObject<T | null>, value: T | null): void {
  Object.defineProperty(ref, "current", {
    writable: true,
    configurable: true,
    value,
  });
}
