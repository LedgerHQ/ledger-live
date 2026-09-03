import type { RequestReceiveProps, RequestReceiveViewProps } from "../../../types";
import { splitAddress } from "../../../utils/splitAddress";

export const REQUEST_RECEIVE_ADDRESS = "0x1234567890abcdef1234567890abcdef";

export const REQUEST_RECEIVE_LABELS: RequestReceiveProps["labels"] = {
  title: "Request USD Coin",
  networkLabel: "Base network",
  actions: { share: "Share", copy: "Copy", copied: "Copied", save: "Save", verify: "Verify" },
};

export function createRequestReceiveProps(
  overrides: Partial<RequestReceiveProps> = {},
): RequestReceiveProps {
  return {
    isOpen: true,
    address: REQUEST_RECEIVE_ADDRESS,
    asset: { name: "USD Coin", ticker: "USDC" },
    network: "Base",
    page: "Pay",
    labels: REQUEST_RECEIVE_LABELS,
    assetIcon: { ledgerId: "usd_coin", ticker: "USDC", network: "base" },
    networkIcon: { ledgerId: "base", ticker: "ETH" },
    visibleActions: ["save", "copy", "verify"],
    onShare: jest.fn(),
    onCopy: jest.fn(),
    onSave: jest.fn(),
    onVerify: jest.fn(),
    onClose: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
}

export function createRequestReceiveViewProps(
  overrides: Partial<RequestReceiveViewProps> = {},
): RequestReceiveViewProps {
  const {
    asset: _asset,
    network: _network,
    page: _page,
    onTrackEvent: _onTrackEvent,
    ...shell
  } = createRequestReceiveProps();

  return {
    ...shell,
    addressParts: splitAddress(REQUEST_RECEIVE_ADDRESS),
    qrPayload: REQUEST_RECEIVE_ADDRESS,
    onShare: jest.fn(),
    onCopy: jest.fn(),
    onSave: jest.fn(),
    onVerify: jest.fn(),
    ...overrides,
  };
}
