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
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import type { UseContacts } from "~/renderer/contacts/useContacts";
import type { RunVerb } from "../types";
import { LIMITS } from "../constants";
import { isInvalidAsciiLabel } from "../validation";
import CharCounter from "../components/CharCounter";
import DeviceActionButton from "../components/DeviceActionButton";

type Props = {
  contacts: UseContacts;
  run: RunVerb;
};

const RenameContactSection = ({ contacts, run }: Props) => {
  const { t } = useTranslation();
  const [oldName, setOldName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const items = useMemo(
    () =>
      Object.values(contacts.wallet.contacts).map(c => ({ value: c.name, label: c.name })),
    [contacts.wallet.contacts],
  );

  const newNameInvalid = isInvalidAsciiLabel(newName, LIMITS.contactName);
  const duplicate = newName.length > 0 && contacts.wallet.contacts[newName] != null;

  const canSubmit =
    oldName !== null &&
    newName.length > 0 &&
    !newNameInvalid &&
    newName !== oldName &&
    !duplicate;

  const submit = async () => {
    if (!oldName) return;
    const ok = await run(deviceId =>
      contacts.renameContact(deviceId, { oldName, newName }),
    );
    if (ok) {
      setOldName(null);
      setNewName("");
    }
  };

  return (
    <section className="flex flex-col gap-12 w-full">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("contacts.sections.renameContact.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <Select
        items={items}
        value={oldName}
        disabled={items.length === 0}
        onValueChange={v => setOldName(v)}
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

      <div className="flex flex-col gap-4 w-full">
        <TextInput
          label={t("contacts.fields.newContactName")}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={oldName === null}
          aria-invalid={newNameInvalid || duplicate}
          errorMessage={duplicate ? t("contacts.errors.duplicateContact") : undefined}
        />
        <CharCounter used={newName.length} limit={LIMITS.contactName} />
      </div>

      <DeviceActionButton
        label={t("contacts.sections.renameContact.button")}
        onClick={submit}
        disabled={!canSubmit}
      />
    </section>
  );
};

export default RenameContactSection;
