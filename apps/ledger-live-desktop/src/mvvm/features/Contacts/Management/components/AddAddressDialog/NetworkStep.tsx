import React from "react";
import { useTranslation } from "react-i18next";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { CryptoOption } from "~/mvvm/features/Contacts/constants/topCryptos";
import { getNetworksForCrypto } from "~/mvvm/features/Contacts/utils/getNetworksForCrypto";
import type { NetworkOption } from "~/mvvm/features/Contacts/constants/networks";

type Props = {
  crypto: CryptoOption;
  onPick: (network: NetworkOption) => void;
};

/**
 * Step 2 of the Add-Address flow (Figma frame 13936:19614).
 *
 * Only rendered when the picked crypto resolves to more than one
 * network — the controller (`AddAddressDialog.tsx`) auto-skips this
 * step when there's only one. Lists the crypto's networks via
 * `getNetworksForCrypto`; each row shows the chain's CryptoIcon
 * (e.g. Ethereum diamond on the Ethereum network row).
 *
 * The "Learn more" link target is unwired in L4 — placeholder anchor
 * with a `TODO(contacts-L4.1)` for the FAQ destination.
 */
export function NetworkStep({ crypto, onPick }: Props) {
  const { t } = useTranslation();
  const networks = getNetworksForCrypto(crypto.id);

  return (
    <div
      // Same spacing as `AssetStep` so the dialog feels consistent
      // step-to-step (Figma frame 13936:19614).
      className="flex flex-col gap-24 px-24 pt-16 pb-24"
      data-testid="contacts-management-add-address-network-step"
    >
      <p className="body-2 text-muted">
        {t("contactsManagement.addAddress.networkBody", { crypto: crypto.name })}{" "}
        {/* TODO(contacts-L4.1): wire to the address-networks FAQ.
            Rendered as a non-functional anchor for now so the visual
            matches Figma 13936:19614. */}
        <a
          href="#"
          onClick={e => e.preventDefault()}
          className="body-2-semi-bold text-accent"
          data-testid="contacts-management-add-address-network-learn"
        >
          {t("contactsManagement.addAddress.learnMore")}
        </a>
      </p>
      <div className="flex flex-col gap-4 max-h-360 overflow-y-auto">
        {networks.map(n => (
          <ListItem
            key={n.id}
            density="expanded"
            onClick={() => onPick(n)}
            data-testid={`contacts-management-add-address-network-${n.id}`}
          >
            <ListItemLeading>
              <CryptoIcon ticker={n.id} ledgerId={n.id} size={40} alt={n.name} />
              <ListItemContent>
                <ListItemTitle>{n.name}</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        ))}
      </div>
    </div>
  );
}
