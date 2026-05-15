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
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import type { UseContacts } from "~/renderer/contacts/useContacts";
import type { RunVerb } from "../types";
import { LIMITS } from "../constants";
import { isInvalidAsciiLabel } from "../validation";
import { useContactEntryPicker } from "../hooks/useContactEntryPicker";
import CharCounter from "../components/CharCounter";
import DeviceActionButton from "../components/DeviceActionButton";

type Props = {
  contacts: UseContacts;
  run: RunVerb;
};

const EditAddressLabelSection = ({ contacts, run }: Props) => {
  const { t } = useTranslation();
  const picker = useContactEntryPicker(contacts);
  const { contact, selectedEntry } = picker;
  const [newLabel, setNewLabel] = useState("");

  const newLabelInvalid = isInvalidAsciiLabel(newLabel, LIMITS.addressLabel);
  const duplicateLabel =
    !!contact &&
    newLabel.length > 0 &&
    contact.entries.some(e => e.scope === newLabel && e !== selectedEntry);

  const canSubmit =
    !!selectedEntry &&
    newLabel.length > 0 &&
    !newLabelInvalid &&
    newLabel !== selectedEntry.scope &&
    !duplicateLabel;

  const submit = async () => {
    if (!contact || !selectedEntry) return;
    const ok = await run(deviceId =>
      contacts.editAddressLabel(deviceId, {
        contactName: contact.name,
        oldLabel: selectedEntry.scope,
        newLabel,
        addressHex: selectedEntry.addressHex,
        chainId: selectedEntry.chainId,
      }),
    );
    if (ok) {
      picker.reset();
      setNewLabel("");
    }
  };

  return (
    <section className="flex flex-col gap-12 w-full">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("contacts.sections.editAddressLabel.title")}</SubheaderTitle>
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

      <div className="flex flex-col gap-4 w-full">
        <TextInput
          label={t("contacts.fields.newAddressName")}
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          disabled={!selectedEntry}
          aria-invalid={newLabelInvalid || duplicateLabel}
          errorMessage={duplicateLabel ? t("contacts.errors.duplicateLabel") : undefined}
        />
        <CharCounter used={newLabel.length} limit={LIMITS.addressLabel} />
      </div>

      <DeviceActionButton
        label={t("contacts.sections.editAddressLabel.button")}
        onClick={submit}
        disabled={!canSubmit}
      />
    </section>
  );
};

export default EditAddressLabelSection;
