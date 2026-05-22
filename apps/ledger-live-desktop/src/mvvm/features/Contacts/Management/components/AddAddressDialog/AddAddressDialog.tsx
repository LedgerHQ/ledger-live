import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { useContacts } from "~/renderer/contacts/useContacts";
import type { Contact } from "~/renderer/contacts/types";
import {
  TOP_CRYPTOS,
  type CryptoOption,
} from "~/mvvm/features/Contacts/constants/topCryptos";
import type { NetworkOption } from "~/mvvm/features/Contacts/constants/networks";
import { getNetworksForCrypto } from "~/mvvm/features/Contacts/utils/getNetworksForCrypto";
import { normalizeAddressHex } from "~/mvvm/features/Contacts/validation";
import RunDeviceAction from "~/mvvm/features/Contacts/components/RunDeviceAction";
import { setCryptoMeta } from "../../utils/cryptoMeta";
import {
  isSidecarContact,
  removeSidecarContact,
} from "../../utils/sidecarContacts";
import { AssetStep } from "./AssetStep";
import { NetworkStep } from "./NetworkStep";
import { AddressStep, type AddressStepSubmit } from "./AddressStep";

/**
 * EVM external-address derivation path. Same constant the L1 panel's
 * RegisterExternalAddress form uses (`forms/RegisterExternalAddressSection.tsx:27`).
 */
const EXTERNAL_DERIVATION_PATH = "44'/60'/0'/0/0";

type Step =
  | { kind: "asset" }
  | { kind: "network"; crypto: CryptoOption }
  | { kind: "address"; crypto: CryptoOption; network: NetworkOption }
  | {
      kind: "device";
      crypto: CryptoOption;
      network: NetworkOption;
      addressHex: string;
      addressName: string;
      verb: (deviceId: string) => Promise<unknown>;
    };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
};

const HEADER_KEY: Record<Step["kind"], string> = {
  asset: "contactsManagement.addAddress.selectAsset",
  network: "contactsManagement.addAddress.selectNetwork",
  address: "contactsManagement.addAddress.enterAddress",
  device: "contactsManagement.addAddress.enterAddress", // header hidden when device runs
};

/**
 * Multi-step Add-Address Dialog (Figma frames 13936:12930 →
 * 13936:19614 → 13936:20087/13957:8439/13957:8939 → device runner).
 *
 * The flow:
 *   1. Asset step: pick a crypto from `TOP_CRYPTOS`. Non-EVM cryptos
 *      are disabled at the row level.
 *   2. Network step: pick a network. Auto-skipped when the crypto
 *      resolves to exactly one network — we jump straight to step 3
 *      with that single network preselected.
 *   3. Address step: enter the 0x address + a name, then `Register`.
 *   4. Device runner: connect the device, run the appropriate DMK
 *      verb. On success the dialog closes and the L4 list updates
 *      from the wallet snapshot + cryptoMeta sidecar.
 *
 * Verb selection:
 *   - If the contact is currently sidecar-only (no on-device HMAC),
 *     we use `addContact` — that DMK verb creates the contact AND
 *     its first address atomically. On success we drop the sidecar
 *     copy so the canonical wallet snapshot wins (no name collision
 *     in `useManagementViewModel`'s merge).
 *   - Otherwise we use `addAddressToContact` to append.
 *
 * Both paths also write the picked crypto into the `cryptoMeta`
 * sidecar so the L4 details pane's per-crypto grouping picks up the
 * new row immediately (the canonical schema has no `coinId` field).
 */
export function AddAddressDialog({ open, onOpenChange, contact }: Props) {
  const { t } = useTranslation();
  const contacts = useContacts();

  // Local step state. Reset to `asset` when the dialog re-opens.
  const [step, setStep] = useState<Step>({ kind: "asset" });

  useEffect(() => {
    if (open) setStep({ kind: "asset" });
  }, [open]);

  const handlePickAsset = useCallback((crypto: CryptoOption) => {
    const networks = getNetworksForCrypto(crypto.id);
    if (networks.length === 1) {
      // Auto-advance past the network step when there's only one
      // choice — UX from the user spec ("if this asset has multiple
      // network, we display this modal").
      setStep({ kind: "address", crypto, network: networks[0] });
    } else {
      setStep({ kind: "network", crypto });
    }
  }, []);

  const handlePickNetwork = useCallback(
    (network: NetworkOption) => {
      if (step.kind !== "network") return;
      setStep({ kind: "address", crypto: step.crypto, network });
    },
    [step],
  );

  const handleSubmitAddress = useCallback(
    ({ addressHex, addressName }: AddressStepSubmit) => {
      if (step.kind !== "address") return;
      const { crypto, network } = step;
      if (typeof network.chainId !== "number") return; // gated upstream

      const normAddress = normalizeAddressHex(addressHex);
      const chainId = network.chainId;
      const wasSidecar = isSidecarContact(contact.name);

      const verb = async (deviceId: string) => {
        if (wasSidecar) {
          // Promote: addContact creates the contact + first address.
          await contacts.addContact(deviceId, {
            name: contact.name,
            addressHex: normAddress,
            scope: addressName,
            derivationPath: EXTERNAL_DERIVATION_PATH,
            chainId,
          });
          // Drop the sidecar copy so the merged view doesn't show a
          // ghost duplicate next to the canonical entry.
          removeSidecarContact(contact.name);
        } else {
          await contacts.addAddressToContact(deviceId, {
            contactName: contact.name,
            name: addressName,
            addressHex: normAddress,
            scope: addressName,
            derivationPath: EXTERNAL_DERIVATION_PATH,
            chainId,
          });
        }
        // Sidecar cryptoMeta so the details pane groups under the
        // picked crypto's ticker rather than the chain-native gas
        // token (e.g. USDC on Ethereum stays USDC, not ETH).
        setCryptoMeta(normAddress, chainId, crypto.id);
      };

      setStep({
        kind: "device",
        crypto,
        network,
        addressHex: normAddress,
        addressName,
        verb,
      });
    },
    [step, contact.name, contacts],
  );

  const handleDeviceDone = useCallback(
    (ok: boolean) => {
      if (ok) onOpenChange(false);
      else setStep({ kind: "address", crypto: getCryptoFromStep(step), network: getNetworkFromStep(step) });
    },
    [step, onOpenChange],
  );

  // Header is hidden while the device runner owns the body — mirrors
  // the L1 ContactsView pattern (no back arrow / close while signing).
  const showHeader = step.kind !== "device";

  const headerTitle = useMemo(() => t(HEADER_KEY[step.kind]), [t, step.kind]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        {showHeader && (
          <DialogHeader
            density="expanded"
            title={headerTitle}
            onClose={() => onOpenChange(false)}
          />
        )}
        <DialogBody
          scrollbarWidth="auto"
          // Override Lumen's intrinsic `px-24` to `px-16` so the body
          // matches the Figma `content-slot` spec for these picker
          // frames (13936:12930 / 13936:19614). The Lumen
          // `DialogHeader density="expanded"` title sits at px-24,
          // and Lumen `ListItem` density="expanded" has its own px-8.
          // With px-16 here: title at 24px from modal edge, row
          // icons at 16+8=24px — everything aligns.
          className="flex flex-col px-16"
          data-testid="contacts-management-add-address-dialog"
        >
          {step.kind === "asset" && <AssetStep onPick={handlePickAsset} />}
          {step.kind === "network" && (
            <NetworkStep crypto={step.crypto} onPick={handlePickNetwork} />
          )}
          {step.kind === "address" && (
            <AddressStep onSubmit={handleSubmitAddress} />
          )}
          {step.kind === "device" && (
            <RunDeviceAction run={step.verb} onDone={handleDeviceDone} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// Helpers — keep the step narrow when the runner reports a back/error
// and we want to drop the user back into the address step with their
// previous crypto+network intact (no need to re-walk the picker).
function getCryptoFromStep(step: Step): CryptoOption {
  if (step.kind === "asset") return TOP_CRYPTOS[0];
  return step.crypto;
}
function getNetworkFromStep(step: Step): NetworkOption {
  if (step.kind === "asset" || step.kind === "network") {
    return getNetworksForCrypto(getCryptoFromStep(step).id)[0];
  }
  return step.network;
}
