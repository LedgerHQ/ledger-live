import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { StyledQRCode } from "~/renderer/components/QRCode/StyledQRCode";
import type { CryptoOption } from "~/mvvm/features/Contacts/constants/topCryptos";
import { getChainInfo } from "../utils/getChainInfo";

type Props = {
  /** The data encoded in the QR — typically the 0x address. */
  data: string;
  /** Resolves the network for the corner badge (and the centre icon when `crypto` is omitted). */
  chainId: number;
  /**
   * The crypto whose icon sits in the centre of the QR. When supplied,
   * we always render the `chainId` badge in the corner — matching the
   * `AddressRow` "double icon" rule and keeping the shape consistent
   * across the contact pane (including ETH-on-Ethereum). When omitted,
   * we fall back to the chain's native gas token with no badge — safe
   * default for callers that don't carry the resolved crypto.
   */
  crypto?: CryptoOption;
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
/**
 * Diameter of the white knockout circle behind the centre crypto logo.
 *
 * The QR's level-H error correction restores up to ~30 % of the modules,
 * so we can comfortably wipe a chunk of them under the badge. Sizing the
 * halo at `iconSize + 16` (8 px ring on every side) gives a clearly
 * circular boundary against the surrounding modules — the previous
 * `p-4` (4 px ring) read as a square because the QR cells sat flush
 * against the badge.
 */
const ICON_SIZE = 40;
const ICON_HALO = ICON_SIZE + 16;

export function QrCodeWithIcon({ data, chainId, crypto, size = 200 }: Props) {
  const chain = getChainInfo(chainId);
  // Prefer the explicit crypto when the caller passes one; otherwise
  // fall back to the chain's native gas token (legacy behaviour).
  const iconTicker = crypto?.ticker ?? chain.ticker;
  const iconLedgerId = crypto?.ledgerId ?? chain.ledgerId;
  const iconAlt = crypto?.name ?? chain.shortLabel;
  // Only attach the network badge when we have a real crypto to pair
  // with it — rendering `network` on top of the chain-native fallback
  // would just stack the same glyph on itself.
  const networkBadge = crypto ? chain.ledgerId : undefined;

  return (
    <div
      data-testid="contacts-management-address-qr"
      className="relative inline-flex items-center justify-center rounded-md bg-white p-12"
      style={{ width: size + 24, height: size + 24 }}
    >
      <StyledQRCode data={data} size={size} />
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        {/*
          Fixed square dimensions (vs. relying on the child to size the
          wrapper) so `rounded-full` always renders as a true circle —
          some `CryptoIcon` glyphs ship at non-square intrinsic ratios
          and would otherwise produce an ellipse.
        */}
        <div
          className="flex items-center justify-center rounded-full bg-white"
          style={{ width: ICON_HALO, height: ICON_HALO }}
        >
          <CryptoIcon
            ticker={iconTicker}
            ledgerId={iconLedgerId}
            network={networkBadge}
            size={ICON_SIZE}
            alt={iconAlt}
          />
        </div>
      </div>
    </div>
  );
}
