import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import QRCode from "~/renderer/components/QRCode";
import { getChainInfo } from "../utils/getChainInfo";

type Props = {
  /** The data encoded in the QR — typically the 0x address. */
  data: string;
  /** Used to render the chain's native crypto icon in the center. */
  chainId: number;
  /** Outer square size in pixels. */
  size?: number;
};

/**
 * QR code with a circular CryptoIcon punched into the center.
 *
 * QR codes have error-correction redundancy (~30% with level H), so a small
 * center cutout doesn't break scanability. The white background ring under
 * the icon gives it visual breathing room against the QR modules and
 * matches the standard pattern used in Receive / wallet QR dialogs across
 * the industry.
 *
 * Wraps `~/renderer/components/QRCode.tsx` (canvas-based, backed by the
 * `qrcode` npm package already in the desktop app's deps).
 */
export function QrCodeWithIcon({ data, chainId, size = 200 }: Props) {
  const chain = getChainInfo(chainId);

  return (
    <div
      data-testid="contacts-management-address-qr"
      className="relative inline-flex items-center justify-center rounded-md bg-white p-12"
      style={{ width: size + 24, height: size + 24 }}
    >
      <QRCode data={data} size={size} />
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="rounded-full bg-white p-4">
          <CryptoIcon
            ticker={chain.ticker}
            ledgerId={chain.ledgerId}
            size={40}
            alt={chain.shortLabel}
          />
        </div>
      </div>
    </div>
  );
}
