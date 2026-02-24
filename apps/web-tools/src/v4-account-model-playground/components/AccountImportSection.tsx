import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { inferAccountId } from "../shared/compatibility";
import { importAccountIdsFromWalletSync } from "../shared/walletSyncImport";

function getErrorMessage(e: unknown): string {
  return e instanceof globalThis.Error ? e.message : String(e);
}

const Section = styled.section`
  margin: 24px 0;
  padding: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fafafa;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 1.1rem;
`;

const InputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
`;

const Input = styled.input`
  flex: 1;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #333;
  background: #333;
  color: #fff;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Error = styled.span`
  color: #c00;
  font-size: 13px;
`;

const AccountIdList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  font-size: 13px;
  max-height: 120px;
  overflow-y: auto;
`;

const AccountIdItem = styled.li`
  padding: 4px 0;
  border-bottom: 1px solid #eee;
  font-family: monospace;
  word-break: break-all;
`;

const DeviceRow = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export default function AccountImportSection({
  accountsBeingUsed,
  onAccountsBeingUsedChange,
  onAddAccountsBeingUsed,
}: {
  accountsBeingUsed: string[];
  onAccountsBeingUsedChange: (ids: string[]) => void;
  onAddAccountsBeingUsed: (ids: string[]) => void;
}) {
  const [accountIdInput, setAccountIdInput] = useState("");
  const [accountIdError, setAccountIdError] = useState("");
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const handleAdd = useCallback(() => {
    const normalized = accountIdInput.replace(/\\"/g, "").replace(/"/g, "").trim();
    if (!normalized) return;
    const rawIds = normalized
      .split(/\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (rawIds.length === 0) return;
    setAccountIdError("");
    const added: string[] = [];
    const errors: string[] = [];
    for (const raw of rawIds) {
      try {
        const id = inferAccountId(raw);
        if (!accountsBeingUsed.includes(id) && !added.includes(id)) added.push(id);
      } catch (e) {
        errors.push(`${raw}: ${getErrorMessage(e)}`);
      }
    }
    if (added.length) {
      onAccountsBeingUsedChange([...accountsBeingUsed, ...added]);
      setAccountIdInput("");
    }
    if (errors.length)
      setAccountIdError(
        errors.length === 1 ? errors[0] : `${errors.length} invalid ID(s). First: ${errors[0]}`,
      );
  }, [accountIdInput, accountsBeingUsed, onAccountsBeingUsedChange]);

  const runImportFromWalletSync = useCallback(() => {
    setDeviceError(null);
    setDeviceLoading(true);
    importAccountIdsFromWalletSync("webhid")
      .then(ids => {
        setDeviceLoading(false);
        if (ids.length) onAddAccountsBeingUsed(ids);
      })
      .catch(err => {
        setDeviceError(getErrorMessage(err));
        setDeviceLoading(false);
      });
  }, [onAddAccountsBeingUsed]);

  return (
    <Section>
      <SectionTitle>Import account by ID</SectionTitle>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <InputRow>
          <Input
            name="account-ids"
            type="text"
            placeholder="Account id(s), space-separated (e.g. js:2:ethereum:0x…)"
            value={accountIdInput}
            onChange={e => setAccountIdInput(e.target.value)}
          />
          <Button type="submit">ADD</Button>
        </InputRow>
      </form>
      {accountIdError && <Error>{accountIdError}</Error>}
      <DeviceRow style={{ flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="button" onClick={runImportFromWalletSync} disabled={deviceLoading}>
            {deviceLoading ? "Syncing…" : "Import from Wallet Sync with device"}
          </Button>
        </span>
        {deviceError && (
          <Error style={{ display: "block", width: "100%", marginTop: 8 }}>{deviceError}</Error>
        )}
      </DeviceRow>
      <AccountIdList>
        {accountsBeingUsed.map(id => (
          <AccountIdItem key={id}>{id}</AccountIdItem>
        ))}
      </AccountIdList>
    </Section>
  );
}
