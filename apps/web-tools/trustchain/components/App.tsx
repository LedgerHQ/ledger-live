import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createQRCodeHostInstance,
  createQRCodeCandidateInstance,
} from "@ledgerhq/trustchain/qrcode/index";
import { crypto } from "@ledgerhq/hw-trustchain";
import { InvalidDigitsError } from "@ledgerhq/trustchain/errors";
import { setEnv, getEnvDefault } from "@ledgerhq/live-env";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from, lastValueFrom } from "rxjs";
import styled from "styled-components";
import { Tooltip } from "react-tooltip";
import {
  JWT,
  MemberCredentials,
  Trustchain,
  TrustchainMember,
  TrustchainSDK,
} from "@ledgerhq/trustchain/types";
import { getInitialStore } from "@ledgerhq/trustchain/store";
import { Actionable, RenderActionable } from "./Actionable";
import Transport from "@ledgerhq/hw-transport";
import QRCode from "./QRCode";
import useEnv from "../useEnv";
import Expand from "./Expand";
import { getSdk } from "@ledgerhq/trustchain/lib-es/index";
import { DisplayName, IdentityManager, memberNameForPubKey } from "./IdentityManager";

const Container = styled.div`
  padding: 20px;
  margin: 0 auto;
  max-width: 800px;
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 0.8em;
  width: 100%;
  flex: 1;
`;

const defaultContext = { applicationId: 16, name: "WebTools" };

const SDKContext = React.createContext<TrustchainSDK>(getSdk(false, defaultContext));

const useSDK = () => useContext(SDKContext);

const App = () => {
  const [context, setContext] = useState(defaultContext);
  const [seedIdAccessToken, setSeedIdAccessToken] = useState<JWT | null>(null);

  // this is the state as it will be used by Ledger Live
  const [state, setState] = useState(getInitialStore);
  const { memberCredentials, trustchain } = state;
  const setMemberCredentials = useCallback(
    (memberCredentials: MemberCredentials | null) =>
      setState(s => ({ trustchain: null, memberCredentials })),
    [],
  );
  const setTrustchain = useCallback(
    (trustchain: Trustchain | null) => setState(s => ({ ...s, trustchain })),
    [],
  );

  const [liveAccessToken, setLiveAccessToken] = useState<JWT | null>(null);

  // on identity change, we reset liveAccessToken
  useEffect(() => {
    setLiveAccessToken(null);
  }, [memberCredentials]);

  const [members, setMembers] = useState<TrustchainMember[] | null>(null);

  // on live auth or trustchain change, we reset members
  useEffect(() => {
    setMembers(null);
  }, [liveAccessToken, trustchain]);

  const mockEnv = useEnv("MOCK");
  const sdk = useMemo(() => getSdk(!!mockEnv, context), [mockEnv, context]);

  return (
    <SDKContext.Provider value={sdk}>
      <Container>
        <h2>Wallet Sync Trustchain Playground</h2>

        <Expand
          title={
            <>
              <span
                data-tooltip-id="tooltip"
                data-tooltip-content="simulates different Live instance. persisted states and shared between browser tabs."
              >
                Identities
              </span>{" "}
              <span style={{ fontWeight: "normal" }}>
                <DisplayName pubkey={state.memberCredentials?.pubkey} />
              </span>
            </>
          }
        >
          <IdentityManager
            state={state}
            setState={setState}
            defaultContext={defaultContext}
            setContext={setContext}
          />
        </Expand>

        <Expand title="Environment">
          <AppSetTrustchainAPIEnv />
          <AppMockEnv />
        </Expand>

        <Expand title="Trustchain SDK" expanded>
          <AppInitLiveCredentials
            memberCredentials={memberCredentials}
            setMemberCredentials={setMemberCredentials}
          />

          <AppDeviceAuthenticate
            seedIdAccessToken={seedIdAccessToken}
            setSeedIdAccessToken={setSeedIdAccessToken}
          />

          <AppGetOrCreateTrustchain
            seedIdAccessToken={seedIdAccessToken}
            memberCredentials={memberCredentials}
            trustchain={trustchain}
            setTrustchain={setTrustchain}
            setSeedIdAccessToken={setSeedIdAccessToken}
          />

          <AppAuthenticate
            liveAccessToken={liveAccessToken}
            setLiveAccessToken={setLiveAccessToken}
            memberCredentials={memberCredentials}
            trustchain={trustchain}
            seedIdAccessToken={seedIdAccessToken}
          />

          <AppGetMembers
            liveAccessToken={liveAccessToken}
            trustchain={trustchain}
            members={members}
            setMembers={setMembers}
          />

          {members?.map(member => (
            <AppMemberRow
              key={member.id}
              seedIdAccessToken={seedIdAccessToken}
              trustchain={trustchain}
              memberCredentials={memberCredentials}
              member={member}
              setTrustchain={setTrustchain}
              setSeedIdAccessToken={setSeedIdAccessToken}
              setMembers={setMembers}
            />
          ))}

          {/* // in future, to facilitate the test, we can do this. for now we can play with the qr code flow.
      {members ? (
        <AppMemberAddForm
          liveAccessToken={liveAccessToken}
          trustchain={trustchain}
          memberCredentials={memberCredentials}
        />
      ) : null}
    */}

          <AppDestroyTrustchain
            trustchain={trustchain}
            setTrustchain={setTrustchain}
            setLiveAccessToken={setLiveAccessToken}
            setSeedIdAccessToken={setSeedIdAccessToken}
            liveAccessToken={liveAccessToken}
          />

          <AppRestoreTrustchain
            liveAccessToken={liveAccessToken}
            memberCredentials={memberCredentials}
            trustchainId={trustchain?.rootId}
            setTrustchain={setTrustchain}
          />

          <AppEncryptUserData trustchain={trustchain} />

          <AppDecryptUserData trustchain={trustchain} />
        </Expand>

        <Expand title="QR Code Host">
          <AppQRCodeHost trustchain={trustchain} memberCredentials={memberCredentials} />
        </Expand>

        <Expand title="QR Code Candidate">
          <AppQRCodeCandidate memberCredentials={memberCredentials} setTrustchain={setTrustchain} />
        </Expand>

        <Tooltip id="tooltip" />
      </Container>
    </SDKContext.Provider>
  );
};

function runWithDevice<T>(fn: (transport: Transport) => Promise<T>): Promise<T> {
  return lastValueFrom(withDevice("webhid")(transport => from(fn(transport))));
}

function AppSetTrustchainAPIEnv() {
  const env = useEnv("TRUSTCHAIN_API");
  const [localValue, setLocalValue] = useState(env);
  const action = useCallback(() => Promise.resolve(localValue), [localValue]);
  return (
    <Actionable
      buttonTitle="Set Trustchain API"
      inputs={[]}
      action={action}
      value={env}
      setValue={v => setEnv("TRUSTCHAIN_API", v || getEnvDefault("TRUSTCHAIN_API"))}
      valueDisplay={() => (
        <Input type="text" value={localValue} onChange={e => setLocalValue(e.target.value)} />
      )}
    />
  );
}

function AppMockEnv() {
  const mockEnv = useEnv("MOCK");
  const action = useCallback(
    (mockEnv: string) => (mockEnv ? "" : Math.random().toString().slice(2)),
    [],
  );
  return (
    <Actionable
      buttonTitle="Toggle Mock Env"
      inputs={[mockEnv]}
      action={action}
      value={mockEnv}
      setValue={v => setEnv("MOCK", v || "")}
      valueDisplay={v => "MOCK ENV: " + (v || "(unset)")}
    />
  );
}

function AppInitLiveCredentials({
  memberCredentials,
  setMemberCredentials,
}: {
  memberCredentials: MemberCredentials | null;
  setMemberCredentials: (memberCredentials: MemberCredentials | null) => void;
}) {
  const sdk = useSDK();
  const action = useCallback(() => sdk.initMemberCredentials(), [sdk]);

  const valueDisplay = useCallback(
    (memberCredentials: MemberCredentials) => "pubkey: " + memberCredentials.pubkey,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.initMemberCredentials"
      inputs={[]}
      action={action}
      setValue={setMemberCredentials}
      value={memberCredentials}
      valueDisplay={valueDisplay}
    />
  );
}

function AppDeviceAuthenticate({
  seedIdAccessToken,
  setSeedIdAccessToken,
}: {
  seedIdAccessToken: { accessToken: string } | null;
  setSeedIdAccessToken: (seedIdAccessToken: { accessToken: string } | null) => void;
}) {
  const sdk = useSDK();

  const action = useCallback(
    () => runWithDevice(transport => sdk.authWithDevice(transport)),
    [sdk],
  );

  const valueDisplay = useCallback(
    (seedIdAccessToken: { accessToken: string }) => seedIdAccessToken.accessToken,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.authWithDevice"
      inputs={[]}
      action={action}
      valueDisplay={valueDisplay}
      value={seedIdAccessToken}
      setValue={setSeedIdAccessToken}
    />
  );
}

function AppGetOrCreateTrustchain({
  seedIdAccessToken,
  memberCredentials,
  trustchain,
  setTrustchain,
  setSeedIdAccessToken,
}: {
  seedIdAccessToken: JWT | null;
  memberCredentials: MemberCredentials | null;
  trustchain: Trustchain | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  setSeedIdAccessToken: (seedIdAccessToken: JWT | null) => void;
}) {
  const sdk = useSDK();

  const action = useCallback(
    (seedIdAccessToken: JWT, memberCredentials: MemberCredentials) =>
      runWithDevice(transport =>
        sdk
          .getOrCreateTrustchain(transport, seedIdAccessToken, memberCredentials)
          .then(({ jwt, trustchain }) => {
            setSeedIdAccessToken(jwt);
            return trustchain;
          })),
    [sdk, setSeedIdAccessToken],
  );

  const valueDisplay = useCallback((trustchain: Trustchain) => trustchain.rootId, []);

  return (
    <Actionable
      buttonTitle="sdk.getOrCreateTrustchain"
      inputs={
        seedIdAccessToken && memberCredentials ? [seedIdAccessToken, memberCredentials] : null
      }
      action={action}
      valueDisplay={valueDisplay}
      value={trustchain}
      setValue={setTrustchain}
    />
  );
}

function AppAuthenticate({
  liveAccessToken,
  setLiveAccessToken,
  memberCredentials,
  trustchain,
  seedIdAccessToken,
}: {
  liveAccessToken: JWT | null;
  setLiveAccessToken: (liveAccessToken: JWT | null) => void;
  memberCredentials: MemberCredentials | null;
  trustchain: Trustchain | null;
  seedIdAccessToken: JWT | null;
}) {
  const sdk = useSDK();

  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      sdk.auth(trustchain, memberCredentials),
    [sdk],
  );

  const valueDisplay = useCallback((liveAccessToken: JWT) => liveAccessToken.accessToken, []);

  return (
    <Actionable
      buttonTitle="sdk.auth"
      inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={liveAccessToken}
      setValue={setLiveAccessToken}
    >
      {seedIdAccessToken && !liveAccessToken ? (
        <button
          style={{ opacity: 0.5, border: "none" }}
          onClick={() => setLiveAccessToken(seedIdAccessToken)}
        >
          set auth from authWithDevice value
        </button>
      ) : null}
    </Actionable>
  );
}

function AppGetMembers({
  liveAccessToken,
  trustchain,
  members,
  setMembers,
}: {
  liveAccessToken: JWT | null;
  trustchain: Trustchain | null;
  members: TrustchainMember[] | null;
  setMembers: (members: TrustchainMember[] | null) => void;
}) {
  const sdk = useSDK();

  const action = useCallback(
    (liveAccessToken: JWT, trustchain: Trustchain) => sdk.getMembers(liveAccessToken, trustchain),
    [sdk],
  );

  const valueDisplay = useCallback(
    (members: TrustchainMember[]) =>
      members.length +
      " member" +
      (members.length > 1 ? "s" : "") +
      (trustchain ? " at " + trustchain.applicationPath : ""),
    [trustchain],
  );

  return (
    <Actionable
      buttonTitle="sdk.getMembers"
      inputs={liveAccessToken && trustchain ? [liveAccessToken, trustchain] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={members}
      setValue={setMembers}
    />
  );
}

function AppMemberRow({
  seedIdAccessToken,
  trustchain,
  memberCredentials,
  member,
  setTrustchain,
  setSeedIdAccessToken,
  setMembers,
}: {
  seedIdAccessToken: JWT | null;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  member: TrustchainMember;
  setTrustchain: (trustchain: Trustchain | null) => void;
  setSeedIdAccessToken: (seedIdAccessToken: JWT | null) => void;
  setMembers: (members: TrustchainMember[] | null) => void;
}) {
  const sdk = useSDK();

  const action = useCallback(
    (seedIdAccessToken: JWT, trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      runWithDevice(transport =>
        sdk.removeMember(transport, seedIdAccessToken, trustchain, memberCredentials, member),
      ).then(async ({ jwt, trustchain }) => {
        setSeedIdAccessToken(jwt);
        setTrustchain(trustchain);
        await sdk.getMembers(jwt, trustchain).then(setMembers);
        return member;
      }),
    [sdk, member, setTrustchain, setSeedIdAccessToken, setMembers],
  );

  return (
    <div style={{ paddingLeft: 40 }}>
      <Actionable
        buttonTitle="sdk.removeMember"
        inputs={
          seedIdAccessToken && trustchain && memberCredentials
            ? [seedIdAccessToken, trustchain, memberCredentials]
            : null
        }
        action={action}
        value={member}
        valueDisplay={member => <DisplayName pubkey={member.id} />}
      />
    </div>
  );
}

function AppDestroyTrustchain({
  trustchain,
  liveAccessToken,
  setTrustchain,
  setLiveAccessToken,
  setSeedIdAccessToken,
}: {
  trustchain: Trustchain | null;
  liveAccessToken: JWT | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  setLiveAccessToken: (liveAccessToken: JWT | null) => void;
  setSeedIdAccessToken: (seedIdAccessToken: JWT | null) => void;
}) {
  const sdk = useSDK();
  const action = useCallback(
    (trustchain: Trustchain, liveAccessToken: JWT) =>
      sdk.destroyTrustchain(trustchain, liveAccessToken).then(() => {
        // all of these state should be reset
        setTrustchain(null);
        setLiveAccessToken(null);
        setSeedIdAccessToken(null);
      }),
    [sdk, setTrustchain, setLiveAccessToken, setSeedIdAccessToken],
  );

  return (
    <Actionable
      buttonTitle="sdk.destroyTrustchain"
      inputs={trustchain && liveAccessToken ? [trustchain, liveAccessToken] : null}
      action={action}
    />
  );
}

function AppRestoreTrustchain({
  liveAccessToken,
  memberCredentials,
  trustchainId,
  setTrustchain,
}: {
  liveAccessToken: JWT | null;
  memberCredentials: MemberCredentials | null;
  trustchainId: string | undefined | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
}) {
  const sdk = useSDK();
  const action = useCallback(
    (liveAccessToken: JWT, trustchainId: string, memberCredentials: MemberCredentials) =>
      sdk.restoreTrustchain(liveAccessToken, trustchainId, memberCredentials),
    [sdk],
  );

  return (
    <Actionable
      buttonTitle="sdk.restoreTrustchain"
      inputs={
        liveAccessToken && memberCredentials && trustchainId
          ? [liveAccessToken, trustchainId, memberCredentials]
          : null
      }
      action={action}
      setValue={setTrustchain}
    />
  );
}

function AppEncryptUserData({ trustchain }: { trustchain: Trustchain | null }) {
  const [input, setInput] = useState<string | null>(null);
  const [output, setOutput] = useState<Uint8Array | null>(null);
  const sdk = useSDK();

  const action = useCallback(
    (trustchain: Trustchain, input: string) => sdk.encryptUserData(trustchain, { input }),
    [sdk],
  );

  const valueDisplay = useCallback(
    (output: Uint8Array) => <code>{crypto.to_hex(output)}</code>,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.encryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={output}
      setValue={setOutput}
    >
      <Input
        placeholder="message to encrypt"
        type="text"
        value={input || ""}
        onChange={e => setInput(e.target.value)}
      />
    </Actionable>
  );
}

function AppDecryptUserData({ trustchain }: { trustchain: Trustchain | null }) {
  const [input, setInput] = useState<string | null>(null);
  const [output, setOutput] = useState<{ input: string } | null>(null);
  const sdk = useSDK();

  const action = useCallback(
    (trustchain: Trustchain, input: string) =>
      sdk.decryptUserData(trustchain, crypto.from_hex(input)).then(obj => obj as { input: string }),
    [sdk],
  );

  const valueDisplay = useCallback((output: { input: string }) => <code>{output.input}</code>, []);

  return (
    <Actionable
      buttonTitle="sdk.decryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={output}
      setValue={setOutput}
    >
      <Input
        placeholder="hex message to decrypt"
        type="text"
        value={input || ""}
        onChange={e => setInput(e.target.value)}
      />
    </Actionable>
  );
}

function AppQRCodeHost({
  trustchain,
  memberCredentials,
}: {
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
}) {
  const sdk = useSDK();
  const [error, setError] = useState<Error | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [digits, setDigits] = useState<string | null>(null);
  const onStart = useCallback(() => {
    if (!trustchain || !memberCredentials) return;
    setError(null);
    createQRCodeHostInstance({
      onDisplayQRCode: url => {
        setUrl(url);
      },
      onDisplayDigits: digits => {
        setDigits(digits);
      },
      addMember: async member => {
        const jwt = await sdk.auth(trustchain, memberCredentials);
        await sdk.addMember(jwt, trustchain, memberCredentials, member);
        return trustchain;
      },
    })
      .catch(e => {
        if (e instanceof InvalidDigitsError) {
          return;
        }
        setError(e);
      })
      .then(() => {
        setUrl(null);
        setDigits(null);
      });
  }, [trustchain, memberCredentials, sdk]);
  return (
    <div>
      {" "}
      <RenderActionable
        enabled={!!trustchain && !!memberCredentials}
        error={error}
        loading={!!url}
        onClick={onStart}
        display={url}
        buttonTitle="Create QR Code Host"
      />
      <div>
        {digits ? (
          <strong>
            Digits: <code>{digits}</code>
          </strong>
        ) : url ? (
          <QRCode data={url} />
        ) : null}
      </div>
    </div>
  );
}

function AppQRCodeCandidate({
  memberCredentials,
  setTrustchain,
}: {
  memberCredentials: MemberCredentials | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
}) {
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const [digits, setDigits] = useState<number | null>(null);
  const [inputCallback, setInputCallback] = useState<((input: string) => void) | null>(null);

  const onRequestQRCodeInput = useCallback(
    (config: { digits: number }, callback: (input: string) => void) => {
      setDigits(config.digits);
      setInputCallback(() => callback);
    },
    [],
  );

  const handleStart = useCallback(
    (scannedUrl: string, memberCredentials: MemberCredentials) => {
      return createQRCodeCandidateInstance({
        memberCredentials,
        scannedUrl,
        memberName: memberNameForPubKey(memberCredentials.pubkey),
        onRequestQRCodeInput,
      })
        .then(trustchain => {
          setTrustchain(trustchain);
          return true;
        })
        .catch(e => {
          // there can be various errors, InvalidDigitsError is one of them that can be handled
          if (e instanceof InvalidDigitsError) {
            alert("Invalid digits");
            return;
          }
          throw e;
        })
        .finally(() => {
          // at this stage, everything is done, we can reset the state
          setScannedUrl(null);
          setInput(null);
          setDigits(null);
          setInputCallback(null);
        });
    },
    [onRequestQRCodeInput, setTrustchain],
  );

  const handleSendDigits = useCallback(
    (inputCallback: (_: string) => void, input: string) => (inputCallback(input), true),
    [],
  );

  return (
    <div>
      <Actionable
        buttonTitle="Set QR Code Host URL"
        inputs={scannedUrl && memberCredentials ? [scannedUrl, memberCredentials] : null}
        action={handleStart}
      >
        <Input type="text" value={scannedUrl || ""} onChange={e => setScannedUrl(e.target.value)} />
      </Actionable>

      {digits ? (
        <Actionable
          buttonTitle="Send Digits"
          inputs={inputCallback && input && digits === input.length ? [inputCallback, input] : null}
          action={handleSendDigits}
        >
          <Input
            type="text"
            maxLength={digits}
            value={input || ""}
            onChange={e => setInput(e.target.value)}
          />
        </Actionable>
      ) : null}
    </div>
  );
}

export default App;
