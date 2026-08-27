import { useState, useCallback } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useCloudSyncViewModel } from "./useCloudSyncViewModel";
import type { CloudSyncDevToolProps } from "../types";

export function CloudSync(props: CloudSyncDevToolProps) {
  const vm = useCloudSyncViewModel(props);

  const [pullError, setPullError] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [destroyError, setDestroyError] = useState<string | null>(null);

  const handlePull = useCallback(async () => {
    setPullError(null);
    try {
      await vm.pull();
    } catch (e) {
      setPullError(String(e));
    }
  }, [vm]);

  const handlePush = useCallback(async () => {
    setPushError(null);
    try {
      await vm.push();
    } catch (e) {
      setPushError(String(e));
    }
  }, [vm]);

  const handleDestroy = useCallback(async () => {
    setDestroyError(null);
    try {
      await vm.destroy();
    } catch (e) {
      setDestroyError(String(e));
    }
  }, [vm]);

  return (
    <div className="flex flex-col overflow-y-auto">
      <BackendRow url={vm.cloudSyncApiBaseUrl} useProd={vm.useProd} setUseProd={vm.setUseProd} />
      <div className="px-16 py-8 border-b border-base flex items-center gap-8 body-3 text-muted">
        {vm.isReady ? (
          <>
            <span className="w-8 h-8 rounded-full bg-success inline-block" />
            <span>Connected</span>
            {vm.version ? <code className="bg-muted rounded px-6 py-1">v{vm.version}</code> : null}
          </>
        ) : (
          <>
            <span className="w-8 h-8 rounded-full bg-error inline-block" />
            <span>No trustchain — open the Trustchain tool first</span>
          </>
        )}
        {vm.liveState?.trustchain ? (
          <code className="ml-auto text-muted">{vm.liveState.trustchain.rootId.slice(0, 8)}…</code>
        ) : null}
      </div>

      {/* Actions */}
      <div className="px-16 py-12 border-b border-base flex flex-wrap items-center gap-8">
        <ActionBtn label="Pull" onClick={handlePull} disabled={!vm.isReady} error={pullError} />
        <ActionBtn label="Push" onClick={handlePush} disabled={!vm.canPush} error={pushError} />
        {vm.listening ? (
          <Button size="sm" appearance="transparent" onClick={vm.stopListen}>
            Stop
          </Button>
        ) : (
          <ActionBtn
            label="Listen"
            onClick={vm.listen}
            disabled={!vm.isReady}
            error={vm.listenError}
          />
        )}
        <ActionBtn
          label="Destroy"
          onClick={handleDestroy}
          disabled={!vm.isReady}
          error={destroyError}
        />
        {vm.listening ? <span className="body-3 text-success">● listening…</span> : null}
      </div>

      {/* JSON — editable; Push sends the current content */}
      <div className="px-16 py-12 flex flex-col gap-8">
        <span className="body-3 text-muted">Document</span>
        <textarea
          value={vm.json}
          onChange={e => vm.setJson(e.target.value)}
          rows={20}
          className="w-full font-mono text-xs bg-base border border-base rounded p-8 text-base resize-y"
          placeholder="Pull to load the cloud document…"
        />
      </div>
    </div>
  );
}

function BackendRow({
  url,
  useProd,
  setUseProd,
}: Readonly<{
  url: string;
  useProd?: boolean;
  setUseProd?: (v: boolean) => void;
}>) {
  return (
    <div className="px-16 py-10 border-b border-base flex items-center gap-12 body-3">
      <span className="text-muted flex-shrink-0">Backend</span>
      <code className="text-base truncate flex-1 min-w-0">{url}</code>
      {setUseProd ? (
        <div className="flex items-center gap-4 flex-shrink-0">
          <EnvButton label="STG" active={!useProd} onClick={() => setUseProd(false)} />
          <EnvButton label="PROD" active={!!useProd} onClick={() => setUseProd(true)} />
        </div>
      ) : null}
    </div>
  );
}

function EnvButton({
  label,
  active,
  onClick,
}: Readonly<{
  label: string;
  active: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-10 py-4 rounded body-3-semi-bold border transition-colors ${
        active
          ? "bg-primary text-on-primary border-primary"
          : "border-base text-muted hover:text-base"
      }`}
    >
      {label}
    </button>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  error,
}: Readonly<{
  label: string;
  onClick: () => void;
  disabled: boolean;
  error: string | null;
}>) {
  return (
    <span className="inline-flex items-center gap-6">
      <Button size="sm" appearance="transparent" disabled={disabled} onClick={onClick}>
        {label}
      </Button>
      {error ? <span className="body-3 text-error">{error}</span> : null}
    </span>
  );
}

export default CloudSync;
