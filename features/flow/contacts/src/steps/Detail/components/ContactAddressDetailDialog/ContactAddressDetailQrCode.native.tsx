import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { AddressQrCode } from "@shared/qr-code";
import type { ContactAddressIconProps } from "../../model/resolveContactAddressIcon";

const QR_ICON_SIZE = 48;

type ContactAddressDetailQrCodeProps = Readonly<{
  address: string;
  iconProps: ContactAddressIconProps;
}>;

export function ContactAddressDetailQrCode({
  address,
  iconProps,
}: ContactAddressDetailQrCodeProps): React.JSX.Element {
  return (
    <AddressQrCode
      value={address}
      testID="contacts-address-detail-qr-code"
      centerContent={
        <CryptoIcon
          ledgerId={iconProps.ledgerId}
          ticker={iconProps.ticker}
          network={iconProps.network}
          size={QR_ICON_SIZE}
          shape="circle"
        />
      }
    />
  );
}
