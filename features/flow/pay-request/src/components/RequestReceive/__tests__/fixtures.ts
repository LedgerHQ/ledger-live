import type { RequestReceiveProps, RequestReceiveViewProps } from "../../../types";
import { splitAddress } from "../../../utils/splitAddress";
import {
  REQUEST_RECEIVE_NETWORK_LABEL,
  REQUEST_RECEIVE_TITLE,
} from "../../../__tests__/i18nWrapper";

export const REQUEST_RECEIVE_ADDRESS = "0x1234567890abcdef1234567890abcdef";

export function createRequestReceiveProps(
  overrides: Partial<RequestReceiveProps> = {},
): RequestReceiveProps {
  return {
    isOpen: true,
    address: REQUEST_RECEIVE_ADDRESS,
    asset: { name: "USD Coin", ticker: "USDC" },
    network: "Base",
    page: "Pay",
    assetIcon: { ledgerId: "usd_coin", ticker: "USDC", network: "base" },
    networkIcon: { ledgerId: "base", ticker: "ETH" },
    visibleActions: ["save", "copy", "verify"],
    onShare: jest.fn(),
    onCopy: jest.fn(),
    onSave: jest.fn(),
    onVerify: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
}

export function createRequestReceiveViewProps(
  overrides: Partial<RequestReceiveViewProps> = {},
): RequestReceiveViewProps {
  const { asset: _asset, network: _network, page: _page, ...shell } = createRequestReceiveProps();

  return {
    ...shell,
    title: REQUEST_RECEIVE_TITLE,
    networkLabel: REQUEST_RECEIVE_NETWORK_LABEL,
    addressParts: splitAddress(REQUEST_RECEIVE_ADDRESS),
    qrPayload: REQUEST_RECEIVE_ADDRESS,
    onShare: jest.fn(),
    onCopy: jest.fn(),
    onSave: jest.fn(),
    onVerify: jest.fn(),
    ...overrides,
  };
}
