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
import RunDeviceAction from "~/mvvm/features/Contacts/components/RunDeviceAction";
import { setCryptoMeta } from "../../utils/cryptoMeta";
import { removeSidecarContact } from "../../utils/sidecarContacts";
import {
  clearContactRename,
  useContactRenames,
} from "../../utils/sidecarOverrides";
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
 * Verb selection (routes on canonical wallet, not sidecar map):
 *   - If the displayed row resolves to a canonical entry on device,
 *     we use `addAddressToContact` to append. We pass the *underlying*
 *     name (pre-rename) because the device knows the group by the
 *     name it was registered with.
 *   - Otherwise the row only exists locally (sidecar-only, possibly
 *     renamed). We promote it with `addContact` — that DMK verb
 *     creates the contact AND its first address atomically — and
 *     drop any sidecar / rename-overlay traces so the merged view
 *     doesn't shadow the new canonical row with a stale ghost.
 *
 * Routing this way avoids the "Contact not found in local store"
 * error that the previous `isSidecarContact(displayName)` check hit
 * for any sidecar contact the user had renamed in L4 (the sidecar
 * map is keyed by the underlying name, so the display-name lookup
 * silently missed and sent us into the canonical branch).
 *
 * Both paths also write the picked crypto into the `cryptoMeta`
 * sidecar so the L4 details pane's per-crypto grouping picks up the
 * new row immediately (the canonical schema has no `coinId` field).
 */
export function AddAddressDialog({ open, onOpenChange, contact }: Props) {
  const { t } = useTranslation();
  const contacts = useContacts();
  const renames = useContactRenames();

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

      // Preserve the user's input verbatim (just trim surrounding
      // whitespace) so the stored entry shows back exactly what they
      // typed — `0x` prefix kept, EIP-55 mixed case kept. DMK is fine
      // with either form: `validateAddressHex` strips `0x` if present,
      // and the TLV serialiser's `encodeTlvHex` does the same before
      // packing the on-wire bytes (see `contactsTlvSerializer.js` →
      // `encodeTlvHex`). The previous `normalizeAddressHex` call was
      // lowercasing + dropping the prefix and the wallet ended up
      // storing `aaff…` instead of `0xAAFF…`.
      const addressForRegistration = addressHex.trim();
      const chainId = network.chainId;

      // Resolve the underlying (pre-rename) name so we look up the
      // right key in the canonical wallet — that map is keyed by the
      // name the device registered the contact under, not the L4
      // display name produced by the renames overlay.
      const underlying =
        Object.entries(renames).find(([, displayName]) => displayName === contact.name)?.[0] ??
        contact.name;
      const isCanonical = underlying in (contacts.wallet?.contacts ?? {});

      const verb = async (deviceId: string) => {
        if (isCanonical) {
          await contacts.addAddressToContact(deviceId, {
            contactName: underlying,
            // `name` must be the CONTACT name — it goes into the
            // device-side CONTACT_NAME TLV and is HMAC'd against
            // `extension.hmacProofHex` (the previous HMAC chain
            // value). If we accidentally pass the address label here
            // the firmware HMAC reconstruction fails and the device
            // rejects with SW 6982, which DMK then mislabels as
            // "Canceled by user". `scope` is the per-address label.
            name: underlying,
            addressHex: addressForRegistration,
            scope: addressName,
            derivationPath: EXTERNAL_DERIVATION_PATH,
            chainId,
          });
        } else {
          // No canonical entry yet — create it on device under the
          // user's current display name so the on-device prompt
          // matches what they see in L4. addContact registers the
          // contact + first address atomically.
          await contacts.addContact(deviceId, {
            name: contact.name,
            addressHex: addressForRegistration,
            scope: addressName,
            derivationPath: EXTERNAL_DERIVATION_PATH,
            chainId,
          });
          // Drop the local-only traces so the merged view doesn't
          // shadow the freshly-registered canonical row.
          removeSidecarContact(underlying);
          clearContactRename(underlying);
        }
        // Sidecar cryptoMeta so the details pane groups under the
        // picked crypto's ticker rather than the chain-native gas
        // token (e.g. USDC on Ethereum stays USDC, not ETH).
        // Key by `(chainId, address, scope)` — the same EVM address
        // can be registered twice on the same chain with different
        // labels (e.g. once tagged ETH and once tagged USDT). Without
        // `scope` in the key the writes collide and the latest one
        // retroactively re-groups every existing entry sharing that
        // address.
        setCryptoMeta(addressForRegistration, chainId, addressName, crypto.id);
      };

      setStep({
        kind: "device",
        crypto,
        network,
        addressHex: addressForRegistration,
        addressName,
        verb,
      });
    },
    [step, contact.name, contacts, renames],
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

  // Per-step back navigation. `asset` is the first step → no back.
  // From `network` we always return to `asset`.
  // From `address` we mirror the forward-path auto-advance: if the
  // selected crypto has a single network we hid the network step on
  // the way in, so we hide it on the way back too and jump straight
  // to `asset`. Otherwise we return to `network` with the crypto
  // preselected so the user lands where they came from.
  const onBack = useMemo<(() => void) | undefined>(() => {
    if (step.kind === "network") {
      return () => setStep({ kind: "asset" });
    }
    if (step.kind === "address") {
      const networks = getNetworksForCrypto(step.crypto.id);
      if (networks.length === 1) {
        return () => setStep({ kind: "asset" });
      }
      return () => setStep({ kind: "network", crypto: step.crypto });
    }
    return undefined;
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        {showHeader && (
          <DialogHeader
            density="expanded"
            title={headerTitle}
            onClose={() => onOpenChange(false)}
            onBack={onBack}
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
