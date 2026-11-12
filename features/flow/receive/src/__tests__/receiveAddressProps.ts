import type { ReceiveAddressProps } from "../types";

export const RECEIVE_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

/** An Ethereum account whose `receive` data answered, with the host checks done. */
export function receiveAddressProps(
  overrides: Partial<ReceiveAddressProps> = {},
): ReceiveAddressProps {
  return {
    address: RECEIVE_ADDRESS,
    asset: { name: "Ethereum", ticker: "ETH" },
    network: "Ethereum",
    assetIcon: { ledgerId: "ethereum", ticker: "ETH", network: "ethereum" },
    networkIcon: { ledgerId: "ethereum", ticker: "ETH" },
    family: { isSupported: true, notices: [], verification: "device" },
    visibleActions: ["share", "copy", "verify"],
    onCopy: jest.fn().mockResolvedValue(true),
    onShare: jest.fn(),
    onVerify: jest.fn(),
    onOpenHelpArticle: jest.fn(),
    onLearnMoreMemoTag: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
}
