import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import type { UseContacts } from "~/renderer/contacts/useContacts";
import type { RunVerb } from "../types";
import { LIMITS } from "../constants";
import {
  isInvalidAsciiLabel,
  isInvalidPartialAddressHex,
  isValidAddressHex,
  normalizeAddressHex,
} from "../validation";
import CharCounter from "../components/CharCounter";
import ContactSearchSelect, {
  type ContactPickResult,
} from "../components/ContactSearchSelect";
import CryptoSelect from "../components/CryptoSelect";
import NetworkSelect from "../components/NetworkSelect";
import AddressInputWithRandom from "../components/AddressInputWithRandom";
import DeviceActionButton from "../components/DeviceActionButton";
import type { NetworkOption } from "../constants/networks";
import { TOP_CRYPTOS, type CryptoOption } from "../constants/topCryptos";
import { getNetworksForCrypto } from "../utils/getNetworksForCrypto";
import { setCryptoMeta } from "../Management/utils/cryptoMeta";

const EXTERNAL_DERIVATION_PATH = "44'/60'/0'/0/0";

type Props = {
  contacts: UseContacts;
  run: RunVerb;
};

const RegisterExternalAddressSection = ({ contacts, run }: Props) => {
  const { t } = useTranslation();
  const [pick, setPick] = useState<ContactPickResult>({ mode: "new", name: "" });
  // Demo-only — see `constants/topCryptos.ts`. The selection is NOT
  // persisted into ContactEntry because its schema is frozen at the
  // DMK shape. TODO(contacts-L4.1): persist once a ticker/coinId field
  // lands in the contact schema.
  const [crypto, setCrypto] = useState<CryptoOption | null>(() => TOP_CRYPTOS[0] ?? null);
  // Network options are derived from the selected crypto. The list can
  // include non-EVM entries (Bitcoin, Solana, …) for UI completeness;
  // the EVM-only submit guard below disables registration when the
  // selected network has no `chainId`.
  const availableNetworks = useMemo<NetworkOption[]>(
    () => (crypto ? getNetworksForCrypto(crypto.id) : []),
    [crypto],
  );
  const [network, setNetwork] = useState<NetworkOption | null>(
    () => availableNetworks[0] ?? null,
  );
  const [addressHex, setAddressHex] = useState("");
  const [label, setLabel] = useState("");

  // When the crypto changes, snap the network to the first available
  // entry for that crypto so the picker is never out of sync. Effect
  // runs on crypto id only — picking the same crypto twice in a row
  // is a no-op.
  useEffect(() => {
    setNetwork(availableNetworks[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crypto?.id]);

  const contactSummaries = useMemo(
    () =>
      Object.values(contacts.wallet.contacts).map(c => ({
        name: c.name,
        entryCount: c.entries.length,
      })),
    [contacts.wallet.contacts],
  );

  const nameInvalid = isInvalidAsciiLabel(pick.name, LIMITS.contactName);
  const labelInvalid = isInvalidAsciiLabel(label, LIMITS.addressLabel);
  const addressInvalid = isInvalidPartialAddressHex(addressHex);

  // EVM-only submission guard: DMK Contacts can only register against
  // EVM chains today. Non-EVM networks render in the dropdown for UI
  // correctness but disable the Register button + show an inline hint.
  const isEvmNetwork = typeof network?.chainId === "number";

  // Duplicate guardrail: prevent registering the same (chainId, address) pair
  // twice on the same contact — the device would reject it anyway.
  const duplicate = useMemo(() => {
    if (!network || !isEvmNetwork || !isValidAddressHex(addressHex) || pick.mode !== "existing") {
      return false;
    }
    const existing = contacts.wallet.contacts[pick.name];
    if (!existing) return false;
    const norm = normalizeAddressHex(addressHex);
    return existing.entries.some(e => e.addressHex === norm && e.chainId === network.chainId);
  }, [contacts.wallet.contacts, addressHex, network, pick, isEvmNetwork]);

  const canSubmit =
    !!network &&
    isEvmNetwork &&
    pick.name.length > 0 &&
    !nameInvalid &&
    label.length > 0 &&
    !labelInvalid &&
    isValidAddressHex(addressHex) &&
    !duplicate;

  const submit = async () => {
    // `canSubmit` already enforces `isEvmNetwork`, so chainId is a
    // number here. The double-check keeps TypeScript narrowing happy
    // without a non-null assertion.
    if (!network || typeof network.chainId !== "number") return;
    const normAddress = normalizeAddressHex(addressHex);
    const ok =
      pick.mode === "existing"
        ? await run(deviceId =>
            contacts.addAddressToContact(deviceId, {
              contactName: pick.name,
              name: pick.name,
              addressHex: normAddress,
              scope: label,
              derivationPath: EXTERNAL_DERIVATION_PATH,
              chainId: network.chainId,
            }),
          )
        : await run(deviceId =>
            contacts.addContact(deviceId, {
              name: pick.name,
              addressHex: normAddress,
              scope: label,
              derivationPath: EXTERNAL_DERIVATION_PATH,
              chainId: network.chainId,
            }),
          );
    if (ok) {
      // Persist the crypto annotation into the sidecar so the L4
      // details pane can group this entry under the right crypto.
      // DEMO-only — see `Management/utils/cryptoMeta.ts` for the
      // rule-violation caveat and migration path.
      if (crypto) {
        // Key by `(chainId, address, scope)` — see cryptoMeta.ts.
        setCryptoMeta(normAddress, network.chainId, label, crypto.id);
      }
      setPick({ mode: "new", name: "" });
      setCrypto(TOP_CRYPTOS[0] ?? null);
      // `network` will be re-synced by the crypto-change effect.
      setAddressHex("");
      setLabel("");
    }
  };

  return (
    <section className="flex flex-col gap-12 w-full">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("contacts.sections.registerAddress.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <div className="flex flex-col gap-4 w-full">
        <ContactSearchSelect
          contacts={contactSummaries}
          value={pick.name}
          onChange={setPick}
          placeholder={t("contacts.fields.contactSearch")}
        />
        <CharCounter used={pick.name.length} limit={LIMITS.contactName} />
      </div>

      <CryptoSelect
        label={t("contacts.fields.crypto")}
        value={crypto?.id ?? null}
        onChange={setCrypto}
      />

      <div className="flex flex-col gap-4 w-full">
        <NetworkSelect
          label={t("contacts.fields.network")}
          networks={availableNetworks}
          value={network?.id ?? null}
          onChange={setNetwork}
          disabled={availableNetworks.length === 0}
        />
        {network && !isEvmNetwork && (
          <p className="body-3 text-error">{t("contacts.errors.evmOnly")}</p>
        )}
      </div>

      <AddressInputWithRandom
        value={addressHex}
        onChange={setAddressHex}
        disabled={!network || !isEvmNetwork}
        invalid={addressInvalid || duplicate}
        errorMessage={
          duplicate
            ? t("contacts.errors.duplicateAddress")
            : addressInvalid
              ? t("contacts.errors.invalidAddress")
              : undefined
        }
        placeholder={t("contacts.fields.address")}
      />

      <div className="flex flex-col gap-4 w-full">
        <TextInput
          label={t("contacts.fields.addressName")}
          value={label}
          onChange={e => setLabel(e.target.value)}
          aria-invalid={labelInvalid}
        />
        <CharCounter used={label.length} limit={LIMITS.addressLabel} />
      </div>

      <DeviceActionButton
        label={t("contacts.sections.registerAddress.button")}
        onClick={submit}
        disabled={!canSubmit}
      />
    </section>
  );
};

export default RegisterExternalAddressSection;
