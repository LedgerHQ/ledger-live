import { InitCredentials } from "../components/sdk/InitCredentials";
import { GetOrCreateTrustchain } from "../components/sdk/GetOrCreateTrustchain";
import { RestoreTrustchain } from "../components/sdk/RestoreTrustchain";
import { GetMembers } from "../components/sdk/GetMembers";
import { MemberRow } from "../components/sdk/MemberRow";
import { EncryptUserData } from "../components/sdk/EncryptUserData";
import { DecryptUserData } from "../components/sdk/DecryptUserData";
import { DestroyApplication } from "../components/sdk/DestroyApplication";
import { DestroyTrustchain } from "../components/sdk/DestroyTrustchain";
import { useTrustchainViewModel } from "./useTrustchainViewModel";
import type { TrustchainDevToolProps } from "../types";

export function Trustchain(props: TrustchainDevToolProps) {
  const vm = useTrustchainViewModel(props);

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Device interaction overlay */}
      {vm.deviceInteractionVisible ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 body-2 text-white">
          Approve on device…
        </div>
      ) : null}

      <BackendRow url={vm.trustchainApiBaseUrl} useProd={vm.useProd} setUseProd={vm.setUseProd} />

      {/* App live state — read-only banner */}
      {vm.liveState ? (
        <div className="px-16 py-10 bg-success-subtle border-b border-base body-3 text-muted flex items-center gap-16">
          <span className="body-3-semi-bold text-success flex-shrink-0">Live state</span>
          {vm.liveState.trustchain ? (
            <code className="truncate">
              {vm.liveState.trustchain.rootId.slice(0, 8)}… @{" "}
              {vm.liveState.trustchain.applicationPath}
            </code>
          ) : (
            <span>no trustchain</span>
          )}
          {vm.liveState.memberCredentials ? (
            <code className="truncate ml-auto">
              pub:{vm.liveState.memberCredentials.pubkey.slice(0, 12)}…
            </code>
          ) : null}
        </div>
      ) : null}

      {/* Tool-local device controls */}
      <DeviceControls deviceId={vm.deviceId} setDeviceId={vm.setDeviceId} />

      {/* SDK operations */}
      <InitCredentials
        sdk={vm.sdk}
        memberCredentials={vm.memberCredentials}
        setMemberCredentials={vm.setMemberCredentials}
      />
      <GetOrCreateTrustchain
        sdk={vm.sdk}
        deviceId={vm.deviceId}
        memberCredentials={vm.memberCredentials}
        trustchain={vm.trustchain}
        setTrustchain={vm.setTrustchain}
        callbacks={vm.callbacks}
      />
      <RestoreTrustchain
        sdk={vm.sdk}
        memberCredentials={vm.memberCredentials}
        trustchain={vm.trustchain}
        setTrustchain={vm.setTrustchain}
      />
      <GetMembers
        sdk={vm.sdk}
        memberCredentials={vm.memberCredentials}
        trustchain={vm.trustchain}
        members={vm.members}
        setMembers={vm.setMembers}
      />
      {vm.members?.map(member => (
        <MemberRow
          key={member.id}
          sdk={vm.sdk}
          deviceId={vm.deviceId}
          trustchain={vm.trustchain}
          memberCredentials={vm.memberCredentials}
          member={member}
          setTrustchain={vm.setTrustchain}
          setMembers={vm.setMembers}
          callbacks={vm.callbacks}
        />
      ))}
      <EncryptUserData sdk={vm.sdk} trustchain={vm.trustchain} />
      <DecryptUserData sdk={vm.sdk} trustchain={vm.trustchain} />
      <DestroyApplication
        sdk={vm.sdk}
        trustchain={vm.trustchain}
        memberCredentials={vm.memberCredentials}
        setTrustchain={vm.setTrustchain}
      />
      <DestroyTrustchain
        sdk={vm.sdk}
        trustchain={vm.trustchain}
        memberCredentials={vm.memberCredentials}
        setTrustchain={vm.setTrustchain}
      />
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

function DeviceControls({
  deviceId,
  setDeviceId,
}: Readonly<{
  deviceId: string;
  setDeviceId: (id: string) => void;
}>) {
  return (
    <div className="px-16 py-10 border-b border-base flex items-center gap-12">
      <span className="text-muted flex-shrink-0 body-3">Device ID</span>
      <input
        type="text"
        value={deviceId}
        onChange={e => setDeviceId(e.target.value)}
        className="flex-1 min-w-0 bg-base border border-base rounded px-6 py-2 body-3 text-base"
      />
    </div>
  );
}

export default Trustchain;
