import React from "react";
import { Subheader } from "@ledgerhq/ldls-ui-react";
import { useTranslation } from "react-i18next";
import { RecentAddressTile } from "./RecentAddressTile";
import type { RecentAddress } from "../../../types";

type RecentAddressesSectionProps = {
  recentAddresses: RecentAddress[];
  onSelect: (address: RecentAddress) => void;
  onRemove: (address: RecentAddress) => void;
};

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
    <div className="w-full min-w-0 flex flex-col">
      <Subheader className="px-24 mb-8" title={t("newSendFlow.recent")} />
      <div className="flex flex-row overflow-x-auto scrollbar-none -mx-16 px-16">
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
