import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  AccountTransactionToolAccount,
  AccountTransactionToolBroadcasted,
  AccountTransactionToolFeeEstimate,
  AccountTransactionToolPrepared,
  AccountTransactionToolProps,
  AccountTransactionToolRequest,
} from "../types";

const PRESETS = ["slow", "medium", "fast"];

const emptyRequest = (assetId = ""): AccountTransactionToolRequest => ({
  assetId,
  recipient: "",
  amount: "",
  useAllAmount: false,
  feeStrategy: "",
  customFees: "",
  feeAssetId: "",
  memo: "",
  memoType: "",
  familyOptions: "",
});

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

type Status =
  | { step: "idle" }
  | { step: "busy"; label: string }
  | { step: "error"; message: string };

function AccountTransaction({
  accounts,
  onPrepare,
  onEstimateFees,
  onSignAndBroadcast,
  onRelease,
}: AccountTransactionToolProps) {
  const [accountUUID, setAccountUUID] = useState("");
  const account = accounts.find(each => each.accountUUID === accountUUID);
  const [request, setRequest] = useState<AccountTransactionToolRequest>(emptyRequest());
  const [status, setStatus] = useState<Status>({ step: "idle" });
  const [prepared, setPrepared] = useState<AccountTransactionToolPrepared>();
  const [estimates, setEstimates] = useState<readonly AccountTransactionToolFeeEstimate[]>();
  const [broadcasted, setBroadcasted] = useState<AccountTransactionToolBroadcasted>();

  const preparationId = useRef<string | undefined>(undefined);
  const release = useRef(onRelease);
  useEffect(() => {
    release.current = onRelease;
  }, [onRelease]);
  useEffect(
    () => () => {
      if (preparationId.current) release.current(preparationId.current);
    },
    [],
  );

  const keep = (next: AccountTransactionToolPrepared | undefined) => {
    preparationId.current = next?.preparationId;
    setPrepared(next);
  };

  const forget = () => {
    if (preparationId.current) onRelease(preparationId.current);
    keep(undefined);
    setBroadcasted(undefined);
  };

  const reset = () => {
    forget();
    setEstimates(undefined);
    setStatus({ step: "idle" });
  };

  const update = (patch: Partial<AccountTransactionToolRequest>) => {
    reset();
    setRequest(current => ({ ...current, ...patch }));
  };

  const selectAccount = (next: AccountTransactionToolAccount | undefined) => {
    reset();
    setAccountUUID(next?.accountUUID ?? "");
    setRequest(emptyRequest(next?.assetIds[0]));
  };

  async function run(label: string, task: () => Promise<void>) {
    setStatus({ step: "busy", label });
    try {
      await task();
      setStatus({ step: "idle" });
    } catch (error) {
      setStatus({ step: "error", message: messageOf(error) });
    }
  }

  const prepare = () =>
    run("preparing…", async () => {
      forget();
      keep(await onPrepare(accountUUID, request));
    });

  const estimate = () =>
    run("estimating…", async () => {
      setEstimates(await onEstimateFees(accountUUID, request, PRESETS));
    });

  const signAndBroadcast = (id: string) =>
    run("signing and broadcasting…", async () => {
      setBroadcasted(await onSignAndBroadcast(id));
      preparationId.current = undefined;
    });

  const busy = status.step === "busy";
  const signable = account?.canSign && prepared && prepared.errors.length === 0 && !broadcasted;

  return (
    <div className="flex flex-col h-full overflow-y-auto select-text">
      <div className="px-16 py-8 border-b border-base flex items-center gap-8">
        <select
          aria-label="Account"
          value={accountUUID}
          disabled={busy}
          onChange={event =>
            selectAccount(accounts.find(each => each.accountUUID === event.target.value))
          }
          className="flex-1 min-w-0 font-mono"
        >
          <option value="">
            {accounts.length === 0 ? "No account in the accounts slice" : "Pick an account"}
          </option>
          {accounts.map(each => (
            <option key={each.accountUUID} value={each.accountUUID}>
              {each.label} · {each.accountUUID.slice(0, 8)}
            </option>
          ))}
        </select>
      </div>

      {account ? (
        <div className="px-16 py-10 flex flex-col gap-8">
          <span className="body-3 text-muted">
            {account.canSign
              ? "A mock account: the signature is simulated, no device needed."
              : "A real account stops at the preparation: signing on the device needs the sign Device Intent, not wired in this tool yet."}
          </span>
          <fieldset disabled={busy} className="contents">
            <Field label="Asset">
              <select
                aria-label="Asset"
                value={request.assetId}
                onChange={event => update({ assetId: event.target.value })}
                className="font-mono"
              >
                {account.assetIds.map(assetId => (
                  <option key={assetId} value={assetId}>
                    {assetId}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Recipient">
              <TextInput
                label="Recipient"
                value={request.recipient}
                onChange={recipient => update({ recipient })}
              />
            </Field>
            <Field label="Amount (smallest unit)">
              <div className="flex items-center gap-8">
                <TextInput
                  label="Amount"
                  value={request.amount}
                  disabled={request.useAllAmount}
                  onChange={amount => update({ amount })}
                />
                <label className="flex items-center gap-4 body-3 text-muted">
                  <input
                    type="checkbox"
                    checked={request.useAllAmount}
                    onChange={event => update({ useAllAmount: event.target.checked })}
                  />
                  max
                </label>
              </div>
            </Field>
            <Field label="Fee strategy">
              <TextInput
                label="Fee strategy"
                placeholder="slow, medium, fast, custom…"
                value={request.feeStrategy}
                onChange={feeStrategy => update({ feeStrategy })}
              />
            </Field>
            <details>
              <summary className="cursor-pointer body-3 text-muted">More options</summary>
              <div className="pt-8 flex flex-col gap-8">
                <Field label="Custom fees (JSON)">
                  <TextInput
                    label="Custom fees"
                    placeholder='{"maxFeePerGas":"30000000000"}'
                    value={request.customFees}
                    onChange={customFees => update({ customFees })}
                  />
                </Field>
                <Field label="Fee asset">
                  <TextInput
                    label="Fee asset"
                    value={request.feeAssetId}
                    onChange={feeAssetId => update({ feeAssetId })}
                  />
                </Field>
                <Field label="Memo">
                  <div className="flex items-center gap-8">
                    <TextInput
                      label="Memo"
                      value={request.memo}
                      onChange={memo => update({ memo })}
                    />
                    <TextInput
                      label="Memo type"
                      placeholder="type"
                      value={request.memoType}
                      onChange={memoType => update({ memoType })}
                    />
                  </div>
                </Field>
                <Field label="Family options (JSON)">
                  <TextInput
                    label="Family options"
                    placeholder='{"rbf":true}'
                    value={request.familyOptions}
                    onChange={familyOptions => update({ familyOptions })}
                  />
                </Field>
              </div>
            </details>
          </fieldset>

          <div className="flex items-center gap-12">
            <button
              type="button"
              disabled={busy}
              onClick={prepare}
              className="body-3-semi-bold text-base"
            >
              Prepare
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={estimate}
              className="body-3-semi-bold text-base"
            >
              Estimate fees
            </button>
            {prepared ? (
              <button
                type="button"
                disabled={busy || !signable}
                onClick={() => signAndBroadcast(prepared.preparationId)}
                className="body-3-semi-bold text-base"
              >
                Sign and broadcast
              </button>
            ) : null}
            <span className="body-3 text-muted">
              {status.step === "busy" ? status.label : null}
            </span>
          </div>

          {status.step === "error" ? (
            <pre role="alert" className="body-3 font-mono text-error whitespace-pre-wrap break-all">
              {status.message}
            </pre>
          ) : null}
          {estimates ? <Estimates estimates={estimates} /> : null}
          {prepared ? <Prepared prepared={prepared} /> : null}
          {broadcasted ? (
            <div className="body-3 font-mono text-base break-all">
              Broadcast {broadcasted.hash} · {broadcasted.pendingRows} pending{" "}
              {broadcasted.pendingRows === 1 ? "row" : "rows"} in Account Operation
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="flex items-center gap-8">
      <span className="w-176 body-3 text-muted">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}>) {
  return (
    <input
      aria-label={label}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={event => onChange(event.target.value)}
      className="w-full font-mono"
    />
  );
}

function Prepared({ prepared }: Readonly<{ prepared: AccountTransactionToolPrepared }>) {
  const rows: [string, string][] = [
    ["source", prepared.sourceId],
    ["amount", prepared.amount],
    ["fees", `${prepared.fees} ${prepared.feeAssetId}`],
    ["total spent", prepared.totalSpent],
    ["errors", prepared.errors.join(", ") || "none"],
    ["warnings", prepared.warnings.join(", ") || "none"],
  ];
  return (
    <table aria-label="Prepared transaction" className="body-3 font-mono">
      <tbody>
        {rows.map(([name, value]) => (
          <tr key={name}>
            <td className="pr-12 text-muted">{name}</td>
            <td className="text-base break-all">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Estimates({
  estimates,
}: Readonly<{ estimates: readonly AccountTransactionToolFeeEstimate[] }>) {
  if (estimates.length === 0) {
    return <span className="body-3 text-muted">The source cannot estimate presets apart.</span>;
  }
  return (
    <table aria-label="Fee estimates" className="body-3 font-mono">
      <tbody>
        {estimates.map(({ strategy, fees, feeAssetId }) => (
          <tr key={strategy}>
            <td className="pr-12 text-muted">{strategy}</td>
            <td className="text-base">
              {fees} {feeAssetId}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AccountTransaction;
