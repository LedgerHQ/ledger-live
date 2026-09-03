import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { QrCode } from "@shared/ui-qr-code";
import { RequestReceiveAddress } from "./RequestReceiveAddress.web";
import type { RequestReceiveIconProps } from "../../types";
import type { AddressParts } from "../../utils/splitAddress";

const QR_CENTER_ICON_SIZE = 48;
const NETWORK_ICON_SIZE = 20;

type RequestReceiveSummaryProps = Readonly<{
  title: string;
  networkLabel: string;
  assetIcon: RequestReceiveIconProps;
  networkIcon?: RequestReceiveIconProps;
  addressParts: AddressParts;
  qrPayload: string;
}>;

export function RequestReceiveSummary({
  title,
  networkLabel,
  assetIcon,
  networkIcon,
  addressParts,
  qrPayload,
}: RequestReceiveSummaryProps) {
  return (
    <div
      className="flex flex-col items-center gap-32 bg-surface p-24 rounded-2xl"
      data-testid="pay-request-receive-summary"
    >
      <div className="flex flex-col items-center gap-8">
        <span className="heading-3-semi-bold text-base">{title}</span>
        <div className="flex flex-row items-center gap-6" data-testid="pay-request-receive-network">
          {networkIcon ? (
            <CryptoIcon
              ledgerId={networkIcon.ledgerId}
              ticker={networkIcon.ticker}
              network={networkIcon.network}
              size={NETWORK_ICON_SIZE}
              shape="circle"
            />
          ) : null}
          <span className="body-2 text-muted">{networkLabel}</span>
        </div>
      </div>
      <QrCode
        value={qrPayload}
        testID="pay-request-receive-qr-code"
        centerContent={
          <CryptoIcon
            ledgerId={assetIcon.ledgerId}
            ticker={assetIcon.ticker}
            size={QR_CENTER_ICON_SIZE}
            shape="circle"
          />
        }
      />
      <div className="flex flex-col items-center">
        <RequestReceiveAddress addressParts={addressParts} />
      </div>
    </div>
  );
}
