import React from "react";
import { Subheader } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { RecentAddressTile } from "./RecentAddressTile";
import type { RecentAddress } from "../types";

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
    <div className="flex flex-col w-full min-w-0">
      <Subheader className="mb-8 px-24" title={t("newSendFlow.recent")} />
      <div className="flex flex-row overflow-x-auto px-24">
        <div className="flex flex-row gap-4">
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
    </div>
  );
}
