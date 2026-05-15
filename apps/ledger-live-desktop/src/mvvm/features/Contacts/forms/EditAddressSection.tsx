import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import type { UseContacts } from "~/renderer/contacts/useContacts";
import type { RunVerb } from "../types";
import { isValidAddressHex, normalizeAddressHex } from "../validation";
import AddressInputWithRandom from "../components/AddressInputWithRandom";
import DeviceActionButton from "../components/DeviceActionButton";

type Props = {
  contacts: UseContacts;
  run: RunVerb;
};

const entryValue = (addressHex: string, chainId: number) => `${addressHex}#${chainId}`;

const EditAddressSection = ({ contacts, run }: Props) => {
  const { t } = useTranslation();
  const [contactName, setContactName] = useState<string | null>(null);
  const [entryKey, setEntryKey] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState("");

  const contactItems = useMemo(
    () =>
      Object.values(contacts.wallet.contacts).map(c => ({ value: c.name, label: c.name })),
    [contacts.wallet.contacts],
  );

  const contact = contactName ? contacts.wallet.contacts[contactName] : null;
  const entryItems = useMemo(
    () =>
      (contact?.entries ?? []).map(e => ({
        value: entryValue(e.addressHex, e.chainId),
        label: e.scope,
      })),
    [contact],
  );

  const selectedEntry = useMemo(
    () => contact?.entries.find(e => entryValue(e.addressHex, e.chainId) === entryKey) ?? null,
    [contact, entryKey],
  );

  const newAddressNormalized = normalizeAddressHex(newAddress);
  const addressInvalid = newAddress.length > 0 && !isValidAddressHex(newAddress);

  const duplicate =
    !!contact &&
    !!selectedEntry &&
    isValidAddressHex(newAddress) &&
    contact.entries.some(
      e =>
        e.addressHex === newAddressNormalized &&
        e.chainId === selectedEntry.chainId &&
        e !== selectedEntry,
    );

  const canSubmit =
    !!selectedEntry &&
    isValidAddressHex(newAddress) &&
    newAddressNormalized !== selectedEntry.addressHex &&
    !duplicate;

  const submit = async () => {
    if (!contact || !selectedEntry) return;
    const ok = await run(deviceId =>
      contacts.editAddress(deviceId, {
        contactName: contact.name,
        oldAddressHex: selectedEntry.addressHex,
        newAddressHex: newAddressNormalized,
        chainId: selectedEntry.chainId,
      }),
    );
    if (ok) {
      setContactName(null);
      setEntryKey(null);
      setNewAddress("");
    }
  };

  return (
    <section className="flex flex-col gap-12 w-full">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("contacts.sections.editAddress.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <Select
        items={contactItems}
        value={contactName}
        disabled={contactItems.length === 0}
        onValueChange={v => {
          setContactName(v);
          setEntryKey(null);
        }}
      >
        <SelectTrigger label={t("contacts.fields.selectContact")} />
        <SelectContent>
          <SelectList
            renderItem={item => (
              <SelectItem key={item.value} value={item.value}>
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            )}
          />
        </SelectContent>
      </Select>

      <Select
        items={entryItems}
        value={entryKey}
        disabled={!contact}
        onValueChange={v => setEntryKey(v)}
      >
        <SelectTrigger label={t("contacts.fields.selectAddress")} />
        <SelectContent>
          <SelectList
            renderItem={item => (
              <SelectItem key={item.value} value={item.value}>
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            )}
          />
        </SelectContent>
      </Select>

      <AddressInputWithRandom
        value={newAddress}
        onChange={setNewAddress}
        disabled={!selectedEntry}
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

      <DeviceActionButton
        label={t("contacts.sections.editAddress.button")}
        onClick={submit}
        disabled={!canSubmit}
      />
    </section>
  );
};

export default EditAddressSection;
