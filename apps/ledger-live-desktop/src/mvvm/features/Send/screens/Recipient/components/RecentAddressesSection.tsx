import type { RecentAddress } from "@ledgerhq/live-common/flows/send/recipient/types";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { RecentAddressTile } from "./RecentAddressTile";

type RecentAddressesSectionProps = Readonly<{
  recentAddresses: RecentAddress[];
  onSelect: (address: RecentAddress) => void;
  onRemove: (address: RecentAddress) => void;
}>;

export function RecentAddressesSection({
  recentAddresses,
  onSelect,
  onRemove,
}: RecentAddressesSectionProps) {
  const { t } = useTranslation();

  if (recentAddresses.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("newSendFlow.recent")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <div className="-mx-24 flex gap-8 overflow-x-auto px-12">
        {recentAddresses.map(address => (
          <RecentAddressTile
            key={address.address}
            recentAddress={address}
            onSelect={() => onSelect(address)}
            onRemove={() => onRemove(address)}
          />
        ))}
      </div>
    </div>
  );
}
