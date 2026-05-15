import React, { useMemo, useState } from "react";
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
import { isPrintableAscii, isValidAddressHex, normalizeAddressHex } from "../validation";
import CharCounter from "../components/CharCounter";
import ContactSearchSelect, {
  type ContactPickResult,
} from "../components/ContactSearchSelect";
import NetworkSelect from "../components/NetworkSelect";
import AddressInputWithRandom from "../components/AddressInputWithRandom";
import DeviceActionButton from "../components/DeviceActionButton";
import { useEvmNetworks, type EvmNetwork } from "../hooks/useEvmNetworks";

const EXTERNAL_DERIVATION_PATH = "44'/60'/0'/0/0";

type Props = {
  contacts: UseContacts;
  run: RunVerb;
};

const RegisterExternalAddressSection = ({ contacts, run }: Props) => {
  const { t } = useTranslation();
  const networks = useEvmNetworks();
  const [pick, setPick] = useState<ContactPickResult>({ mode: "new", name: "" });
  // Default to Ethereum (first entry — `useEvmNetworks` is popularity-sorted).
  const [network, setNetwork] = useState<EvmNetwork | null>(() => networks[0] ?? null);
  const [addressHex, setAddressHex] = useState("");
  const [label, setLabel] = useState("");

  const contactSummaries = useMemo(
    () =>
      Object.values(contacts.wallet.contacts).map(c => ({
        name: c.name,
        entryCount: c.entries.length,
      })),
    [contacts.wallet.contacts],
  );

  const nameInvalid =
    pick.name.length > LIMITS.contactName || !isPrintableAscii(pick.name);
  const labelInvalid =
    label.length > LIMITS.addressLabel || !isPrintableAscii(label);
  const addressInvalid = addressHex.length > 0 && !isValidAddressHex(addressHex);

  // Duplicate guardrail: prevent registering the same (chainId, address) pair
  // twice on the same contact — the device would reject it anyway.
  const duplicate = useMemo(() => {
    if (!network || !isValidAddressHex(addressHex) || pick.mode !== "existing") return false;
    const existing = contacts.wallet.contacts[pick.name];
    if (!existing) return false;
    const norm = normalizeAddressHex(addressHex);
    return existing.entries.some(e => e.addressHex === norm && e.chainId === network.chainId);
  }, [contacts.wallet.contacts, addressHex, network, pick]);

  const canSubmit =
    !!network &&
    pick.name.length > 0 &&
    !nameInvalid &&
    label.length > 0 &&
    !labelInvalid &&
    isValidAddressHex(addressHex) &&
    !duplicate;

  const submit = async () => {
    if (!network) return;
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
      setPick({ mode: "new", name: "" });
      setNetwork(networks[0] ?? null);
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

      <NetworkSelect
        label={t("contacts.fields.network")}
        value={network?.id ?? null}
        onChange={setNetwork}
      />

      <AddressInputWithRandom
        value={addressHex}
        onChange={setAddressHex}
        disabled={!network}
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
