import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { AnimatedQrCode } from "@shared/ui-animated-qr-code/web";
import type { AddressSummaryProps } from "./AddressSummary.types";

const QR_SIZE = 208;
const QR_CENTER_ICON_SIZE = 48;

export function AddressSummary({ address, onCopy, copyLabel, copyKey }: AddressSummaryProps) {
  const { start, middle, end } = address.parts;
  const { assetIcon } = address;

  return (
    <div className="flex flex-col items-center gap-16" data-testid="receive-address-summary">
      {address.label ? <span className="body-2-semi-bold text-base">{address.label}</span> : null}
      <div className="flex size-256 items-center justify-center rounded-2xl bg-white">
        <AnimatedQrCode
          value={address.value}
          size={QR_SIZE}
          animation="ripple"
          onPress={onCopy}
          accessibilityLabel={copyLabel}
          triggerKey={copyKey}
          testID="receive-address-qr-code"
          centerContent={
            assetIcon ? (
              <CryptoIcon
                ledgerId={assetIcon.ledgerId}
                ticker={assetIcon.ticker}
                network={assetIcon.network}
                size={QR_CENTER_ICON_SIZE}
                shape="circle"
              />
            ) : undefined
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
