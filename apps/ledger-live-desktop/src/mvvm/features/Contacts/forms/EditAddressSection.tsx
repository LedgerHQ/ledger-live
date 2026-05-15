import React, { useState } from "react";
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
import {
  isInvalidPartialAddressHex,
  isValidAddressHex,
  normalizeAddressHex,
} from "../validation";
import { useContactEntryPicker } from "../hooks/useContactEntryPicker";
import AddressInputWithRandom from "../components/AddressInputWithRandom";
import DeviceActionButton from "../components/DeviceActionButton";

type Props = {
  contacts: UseContacts;
  run: RunVerb;
};

const EditAddressSection = ({ contacts, run }: Props) => {
  const { t } = useTranslation();
  const picker = useContactEntryPicker(contacts);
  const { contact, selectedEntry } = picker;
  const [newAddress, setNewAddress] = useState("");

  const newAddressNormalized = normalizeAddressHex(newAddress);
  const addressInvalid = isInvalidPartialAddressHex(newAddress);

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
      picker.reset();
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
        items={picker.contactItems}
        value={picker.contactName}
        disabled={picker.contactItems.length === 0}
        onValueChange={picker.selectContact}
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
        items={picker.entryItems}
        value={picker.entryKey}
        disabled={!contact}
        onValueChange={picker.selectEntry}
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
