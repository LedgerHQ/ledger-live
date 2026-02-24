/**
 * Transactional UI brick: Prepare → Sign (device) → Broadcast → pending op.
 * Prepare validates; Sign calls device; Broadcast adds pending op (prepended in Operations).
 */
import React, { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import BigNumber from "bignumber.js";
import { useDispatch } from "react-redux";
import { firstValueFrom } from "rxjs";
import { filter } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Account, SignedOperation } from "@ledgerhq/types-live";
import { store } from "../store";
import type { RootState } from "../store";
import { selectAccountReconstructionInput } from "../store/selectors";
import { reconstructAccountFromReconstructionInput } from "../shared/compatibility";
import { getAlpacaTransactionAdapter } from "../shared/alpacaTransactionAdapter";
import { isAlpacaForAccountId } from "../shared/syncStrategy";
import { addPendingOperationForAccount } from "../data-layer/transactional/slice";
import { operationToStored } from "../data-layer/operationHistory/actions";

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

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
`;

const Input = styled.input`
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
  margin-right: 8px;
  margin-top: 4px;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonSuccess = styled(Button)`
  background: #0a0;
  border-color: #0a0;
`;

const Error = styled.span`
  color: #c00;
  font-size: 13px;
  display: block;
  margin-top: 8px;
`;

const Success = styled.span`
  color: #0a0;
  font-size: 13px;
  display: block;
  margin-top: 8px;
`;

const JsonBlock = styled.pre`
  margin: 12px 0 0;
  padding: 12px;
  font-size: 11px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
  overflow: auto;
  max-height: 280px;
  white-space: pre-wrap;
  word-break: break-all;
`;

const JsonLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  margin-top: 16px;
  margin-bottom: 4px;
`;

function toDisplayJson(obj: unknown): string {
  return JSON.stringify(
    obj,
    (_, v) => {
      if (v instanceof BigNumber) return v.toString();
      if (v != null && typeof v === "object" && typeof (v as { toString?: () => string }).toString === "function")
        if ("isBigNumber" in v || "toFixed" in v) return (v as { toString: () => string }).toString();
      return v;
    },
    2,
  );
}

async function getAccount(accountId: string): Promise<Account | undefined> {
  const state = store.getState() as RootState;
  const input = selectAccountReconstructionInput(state, accountId);
  if (!input) return undefined;
  return reconstructAccountFromReconstructionInput(input);
}

type Step = "idle" | "prepared" | "signed";

export default function TransactionalSection({
  selectedAccountId,
}: {
  accountsBeingUsed: string[];
  selectedAccountId: string | null;
}) {
  const dispatch = useDispatch();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [preparedTransactionJson, setPreparedTransactionJson] = useState<string | null>(null);
  const [statusJson, setStatusJson] = useState<string | null>(null);
  const [signedOperationJson, setSignedOperationJson] = useState<string | null>(null);

  const preparedAccountRef = useRef<Account | null>(null);
  const preparedTransactionRef = useRef<unknown>(null);
  const signedOperationRef = useRef<SignedOperation | null>(null);

  const resetToIdle = useCallback(() => {
    setStep("idle");
    setPreparedTransactionJson(null);
    setStatusJson(null);
    setSignedOperationJson(null);
    setSuccessMsg(null);
    preparedAccountRef.current = null;
    preparedTransactionRef.current = null;
    signedOperationRef.current = null;
  }, []);

  const handlePrepare = useCallback(async () => {
    if (!selectedAccountId || !recipient.trim() || !amount.trim()) return;
    setError(null);
    setSuccessMsg(null);
    setPreparedTransactionJson(null);
    setStatusJson(null);
    setSignedOperationJson(null);
    setLoading(true);
    try {
      const account = await getAccount(selectedAccountId);
      if (!account) {
        setError("Account not in store. Load it first.");
        return;
      }
      if (!isAlpacaForAccountId(selectedAccountId)) {
        setError("Send is only wired for Alpaca accounts (EVM, XRP, Stellar, Tezos).");
        return;
      }
      const bridge = getAccountBridge(account);
      const transaction = bridge.createTransaction(account);
      const updatedTransaction = bridge.updateTransaction(transaction, {
        recipient: recipient.trim(),
        amount: new BigNumber(amount.trim()),
      });
      const adapter = getAlpacaTransactionAdapter(getAccount);
      const preparedTransaction = await adapter.prepareTransaction(account, updatedTransaction);
      const status = await adapter.getTransactionStatus(account, preparedTransaction);
      setPreparedTransactionJson(toDisplayJson(preparedTransaction));
      setStatusJson(toDisplayJson(status));
      const statusErrors =
        status && typeof status === "object" && "errors" in status && (status as { errors?: Record<string, unknown> }).errors;
      const firstError =
        statusErrors && Object.keys(statusErrors).length > 0 ? Object.values(statusErrors)[0] : null;
      if (firstError != null) {
        const message =
          typeof firstError === "object" &&
          firstError !== null &&
          "message" in firstError &&
          typeof (firstError as Error).message === "string"
            ? (firstError as Error).message
            : String(firstError);
        setError(message);
      } else {
        preparedAccountRef.current = account;
        preparedTransactionRef.current = preparedTransaction;
        setStep("prepared");
        setSuccessMsg("Transaction prepared. Sign on your Ledger device.");
      }
    } catch (e: unknown) {
      const message =
        typeof e === "object" && e !== null && "message" in e && typeof (e as Error).message === "string"
          ? (e as Error).message
          : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, recipient, amount]);

  const handleSign = useCallback(async () => {
    const account = preparedAccountRef.current;
    const transaction = preparedTransactionRef.current;
    if (!account || !transaction || !selectedAccountId) return;
    setError(null);
    setLoading(true);
    try {
      const bridge = getAccountBridge(account);
      const obs = bridge.signOperation({
        account,
        transaction,
        deviceId: "webhid",
      });
      const signedEvent = await firstValueFrom(
        obs.pipe(filter((e: { type: string }): e is { type: "signed"; signedOperation: SignedOperation } => e.type === "signed")),
      );
      const signedOp = signedEvent.signedOperation;
      signedOperationRef.current = signedOp;
      setSignedOperationJson(toDisplayJson(signedOp));
      setStep("signed");
      setSuccessMsg("Signed. You can broadcast.");
      setPreparedTransactionJson(null);
      setStatusJson(null);
    } catch (e: unknown) {
      const message =
        typeof e === "object" && e !== null && "message" in e && typeof (e as Error).message === "string"
          ? (e as Error).message
          : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  const handleBroadcast = useCallback(async () => {
    const account = preparedAccountRef.current;
    const signedOp = signedOperationRef.current;
    if (!account || !signedOp || !selectedAccountId) return;
    setError(null);
    setLoading(true);
    try {
      const adapter = getAlpacaTransactionAdapter(getAccount);
      const operationWithHash = await adapter.broadcast({
        account,
        signedOperation: signedOp,
      });
      const stored = operationToStored(operationWithHash);
      dispatch(addPendingOperationForAccount({ accountId: selectedAccountId, operation: stored }));
      setSuccessMsg("Broadcast done. Pending op added (prepended in Operations).");
      resetToIdle();
    } catch (e: unknown) {
      const message =
        typeof e === "object" && e !== null && "message" in e && typeof (e as Error).message === "string"
          ? (e as Error).message
          : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, dispatch, resetToIdle]);

  const isPrepared = step === "prepared";
  const isSigned = step === "signed";

  return (
    <Section>
      <SectionTitle>Send (transactional)</SectionTitle>
      <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
        Prepare → Sign on device → Broadcast. Pending op appears at top of Operations.
      </p>
      <Row>
        <Label>Recipient</Label>
        <Input
          type="text"
          placeholder="0x… or address"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
        />
      </Row>
      <Row>
        <Label>Amount</Label>
        <Input type="text" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
      </Row>
      <Button onClick={handlePrepare} disabled={loading || !selectedAccountId}>
        {loading && step === "idle" ? "Preparing…" : "Prepare"}
      </Button>
      {isPrepared && (
        <ButtonSuccess onClick={handleSign} disabled={loading}>
          {loading ? "Signing…" : "Sign"}
        </ButtonSuccess>
      )}
      {isSigned && (
        <ButtonSuccess onClick={handleBroadcast} disabled={loading}>
          {loading ? "Broadcasting…" : "Broadcast"}
        </ButtonSuccess>
      )}
      {error != null && <Error>{error}</Error>}
      {successMsg && <Success>{successMsg}</Success>}
      {isSigned && signedOperationJson != null && (
        <>
          <JsonLabel>Signed operation</JsonLabel>
          <JsonBlock>{signedOperationJson}</JsonBlock>
        </>
      )}
      {!isSigned && preparedTransactionJson != null && (
        <>
          <JsonLabel>Prepared transaction</JsonLabel>
          <JsonBlock>{preparedTransactionJson}</JsonBlock>
        </>
      )}
      {!isSigned && statusJson != null && (
        <>
          <JsonLabel>Status</JsonLabel>
          <JsonBlock>{statusJson}</JsonBlock>
        </>
      )}
    </Section>
  );
}
