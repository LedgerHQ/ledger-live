import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { QrCode } from "@shared/ui-qr-code";
import type { AddressSummaryProps } from "./AddressSummary.types";

const QR_SIZE = 208;
const QR_CENTER_ICON_SIZE = 48;
// The card is white in both themes: the modules stay dark.
const QR_MODULES_COLOR = ledgerLiveThemes.light.colors.text.black;

/** The QR card, the asset icon in its middle, then the address with its edges standing out. */
export function AddressSummary({ address }: AddressSummaryProps) {
  const { start, middle, end } = address.parts;

  return (
    <div className="flex flex-col items-center gap-16" data-testid="receive-address-summary">
      {address.label ? <span className="body-2-semi-bold text-base">{address.label}</span> : null}
      <div className="flex size-256 items-center justify-center rounded-2xl bg-white">
        <QrCode
          value={address.value}
          size={QR_SIZE}
          foregroundColor={QR_MODULES_COLOR}
          testID="receive-address-qr-code"
          centerContent={
            <CryptoIcon
              ledgerId={address.assetIcon.ledgerId}
              ticker={address.assetIcon.ticker}
              network={address.assetIcon.network}
              size={QR_CENTER_ICON_SIZE}
              shape="circle"
            />
          }
        />
      </div>
      <p
        className="w-256 break-all text-center body-2 text-muted"
        data-testid="receive-address-text"
      >
        <span className="text-base">{start}</span>
        {middle}
        <span className="text-base">{end}</span>
      </p>
    </div>
  );
}
