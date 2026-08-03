import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { Tag } from "@ledgerhq/lumen-ui-react";
import { resolveContactAddressIconProps } from "../../model/resolveContactAddressIcon";
import type { ContactAddressDetailDialogProps } from "./types";

const ADDRESS_ICON_SIZE = 64;

type ContactAddressDetailSummaryProps = Readonly<{
  row: NonNullable<ContactAddressDetailDialogProps["row"]>;
  network: NonNullable<ContactAddressDetailDialogProps["network"]>;
  formatNetworkTag: ContactAddressDetailDialogProps["labels"]["formatNetworkTag"];
}>;

export function ContactAddressDetailSummary({
  row,
  network,
  formatNetworkTag,
}: ContactAddressDetailSummaryProps): React.ReactNode {
  const iconProps = resolveContactAddressIconProps(row.currencyId, row.label, network.networkId);

  return (
    <div className="flex flex-col items-center gap-32">
      <CryptoIcon
        ledgerId={iconProps.ledgerId}
        ticker={iconProps.ticker}
        network={iconProps.network}
        size={ADDRESS_ICON_SIZE}
        shape="circle"
      />
      <div className="flex flex-col items-center gap-8">
        <Tag
          appearance="gray"
          size="sm"
          label={formatNetworkTag(network.networkName)}
          data-testid="contacts-address-detail-network-tag"
        />
        <div className="flex flex-col items-center text-center">
          <p className="heading-3-semi-bold text-base">{row.label}</p>
          <p
            className="body-2 break-all text-muted"
            data-testid="contacts-address-detail-full-address"
          >
            {row.address}
          </p>
        </div>
      </div>
    </div>
  );
}
