import { useState, useCallback } from "react";
import {
  Banner,
  Button,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
  Subheader,
  SubheaderDescription,
  SubheaderRow,
  SubheaderTitle,
  Tag,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { useCloudSyncViewModel } from "./useCloudSyncViewModel";
import type { CloudSyncDevToolProps } from "../types";

function CloudSync(props: CloudSyncDevToolProps) {
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

  const errors = [
    ["Pull", pullError],
    ["Push", pushError],
    ["Listen", vm.listenError],
    ["Destroy", destroyError],
  ] as const;

  return (
    <div className="flex flex-col overflow-y-auto">
      <BackendRow url={vm.cloudSyncApiBaseUrl} useProd={vm.useProd} setUseProd={vm.setUseProd} />
      <Divider />
      <div className="px-16 py-8 flex items-center gap-8">
        {vm.isReady ? (
          <>
            <Tag size="sm" appearance="success" label="Connected" />
            {vm.version ? <Tag size="sm" appearance="gray" label={`v${vm.version}`} /> : null}
          </>
        ) : (
          <Tag
            size="sm"
            appearance="error"
            label="No trustchain — open the Trustchain tool first"
          />
        )}
        {vm.liveState?.trustchain ? (
          <Tag
            size="sm"
            appearance="gray"
            label={`${vm.liveState.trustchain.rootId.slice(0, 8)}…`}
            className="ml-auto"
          />
        ) : null}
      </div>
      <Divider />

      <div className="px-16 py-12 flex flex-wrap items-center gap-8">
        <Button size="sm" appearance="gray" onClick={handlePull} disabled={!vm.isReady}>
          Pull
        </Button>
        <Button size="sm" appearance="gray" onClick={handlePush} disabled={!vm.canPush}>
          Push
        </Button>
        {vm.listening ? (
          <Button size="sm" appearance="gray" onClick={vm.stopListen}>
            Stop
          </Button>
        ) : (
          <Button size="sm" appearance="gray" onClick={vm.listen} disabled={!vm.isReady}>
            Listen
          </Button>
        )}
        <Button size="sm" appearance="red" onClick={handleDestroy} disabled={!vm.isReady}>
          Destroy
        </Button>
        {vm.listening ? <Tag size="sm" appearance="success" label="listening…" /> : null}
      </div>
      {errors.map(([action, error]) =>
        error ? (
          <div key={action} className="px-16 pb-8">
            <Banner appearance="error" title={`${action} failed`} description={error} />
          </div>
        ) : null,
      )}
      <Divider />

      <div className="px-16 py-12">
        <TextInput
          multiline
          minLines={10}
          maxLines={20}
          label="Document"
          value={vm.json}
          onChange={e => vm.setJson(e.target.value)}
          placeholder="Pull to load the cloud document…"
          className="[&_textarea]:font-mono"
          hideClearButton
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
    <div className="px-16 py-10 flex items-center gap-12">
      <Subheader className="flex-1 min-w-0">
        <SubheaderRow>
          <SubheaderTitle>Backend</SubheaderTitle>
        </SubheaderRow>
        <SubheaderDescription>{url}</SubheaderDescription>
      </Subheader>
      {setUseProd ? (
        <SegmentedControl
          selectedValue={useProd ? "prod" : "stg"}
          onSelectedChange={value => setUseProd(value === "prod")}
          tabLayout="fit"
          aria-label="Backend environment"
        >
          <SegmentedControlButton value="stg">STG</SegmentedControlButton>
          <SegmentedControlButton value="prod">PROD</SegmentedControlButton>
        </SegmentedControl>
      ) : null}
    </div>
  );
}

export default CloudSync;
