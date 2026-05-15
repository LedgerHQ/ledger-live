import React, { useEffect, useMemo, useState } from "react";
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
import NetworkSelect from "../components/NetworkSelect";
import { useEvmNetworks, type EvmNetwork } from "../hooks/useEvmNetworks";

const MAX_ACCOUNT_INDEX = 9; // 0..9, matches typical Ledger Live account-discovery depth.
const derivationPath = (index: number) => `44'/60'/${index}'/0/0`;

type Props = {
  contacts: UseContacts;
  run: RunVerb;
};

const RegisterLedgerAccountSection = ({ contacts, run }: Props) => {
  const { t } = useTranslation();
  const networks = useEvmNetworks();
  // Default to Ethereum (first entry — `useEvmNetworks` is popularity-sorted).
  const [network, setNetwork] = useState<EvmNetwork | null>(() => networks[0] ?? null);
  const [accountIndex, setAccountIndex] = useState<number>(0);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  // Suggest the next free index on the chosen chain (mirrors DMK playground behavior).
  const suggestedIndex = useMemo(() => {
    if (!network) return 0;
    return Object.values(contacts.wallet.accounts).filter(
      a => a.chainId === network.chainId,
    ).length;
  }, [contacts.wallet.accounts, network]);

  useEffect(() => {
    setAccountIndex(suggestedIndex);
  }, [suggestedIndex]);

  // Auto-fill the name as "<Network> <index+1>" until the user takes ownership of the field.
  useEffect(() => {
    if (nameTouched) return;
    if (!network) {
      setName("");
      return;
    }
    setName(`${network.name} ${accountIndex + 1}`);
  }, [network, accountIndex, nameTouched]);

  const nameInvalid = isInvalidAsciiLabel(name, LIMITS.accountName);
  const duplicateName = name.length > 0 && contacts.wallet.accounts[name] != null;

  const indexItems = useMemo(
    () =>
      Array.from({ length: MAX_ACCOUNT_INDEX + 1 }, (_, i) => ({
        value: String(i),
        label: String(i),
      })),
    [],
  );

  const canSubmit = !!network && name.length > 0 && !nameInvalid && !duplicateName;

  const submit = async () => {
    if (!network) return;
    const ok = await run(deviceId =>
      contacts.addLedgerAccount(deviceId, {
        name,
        derivationPath: derivationPath(accountIndex),
        chainId: network.chainId,
      }),
    );
    if (ok) {
      setNetwork(networks[0] ?? null);
      setAccountIndex(0);
      setName("");
      setNameTouched(false);
    }
  };

  return (
    <section className="flex flex-col gap-12 w-full">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("contacts.sections.registerAccount.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <NetworkSelect
        label={t("contacts.fields.network")}
        value={network?.id ?? null}
        onChange={setNetwork}
      />

      <Select
        items={indexItems}
        value={String(accountIndex)}
        disabled={!network}
        onValueChange={v => {
          if (v !== null) setAccountIndex(Number(v));
        }}
      >
        <SelectTrigger label={t("contacts.fields.accountIndex")} />
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
          label={t("contacts.fields.accountName")}
          value={name}
          onChange={e => {
            setNameTouched(true);
            setName(e.target.value);
          }}
          disabled={!network}
          aria-invalid={nameInvalid || duplicateName}
          errorMessage={duplicateName ? t("contacts.errors.duplicateAccount") : undefined}
        />
        <CharCounter used={name.length} limit={LIMITS.accountName} />
      </div>

      <DeviceActionButton
        label={t("contacts.sections.registerAccount.button")}
        onClick={submit}
        disabled={!canSubmit}
      />
    </section>
  );
};

export default RegisterLedgerAccountSection;
