import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { QrCode } from "@shared/ui-qr-code";
import { AddressText } from "./AddressText";
import type { ReceiveAddressIconProps } from "../../../types";
import type { AddressParts } from "../../../utils/splitAddress";

const QR_SIZE = 208;
const QR_CENTER_ICON_SIZE = 48;
// The QR card is white in both themes, so the modules stay black.
const QR_MODULES_COLOR = ledgerLiveThemes.light.colors.text.black;

type AddressSummaryProps = Readonly<{
  assetIcon: ReceiveAddressIconProps;
  addressParts: AddressParts;
  qrPayload: string;
}>;

export function AddressSummary({ assetIcon, addressParts, qrPayload }: AddressSummaryProps) {
  return (
    <div className="flex flex-col items-center gap-16" data-testid="receive-address-summary">
      <div className="flex size-256 items-center justify-center rounded-2xl bg-white">
        <QrCode
          value={qrPayload}
          size={QR_SIZE}
          foregroundColor={QR_MODULES_COLOR}
          testID="receive-address-qr-code"
          centerContent={
            <CryptoIcon
              ledgerId={assetIcon.ledgerId}
              ticker={assetIcon.ticker}
              network={assetIcon.network}
              size={QR_CENTER_ICON_SIZE}
              shape="circle"
            />
          }
        />
      </div>
      <AddressText addressParts={addressParts} />
    </div>
  );
}
