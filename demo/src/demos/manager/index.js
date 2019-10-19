// @flow
import React, { useState, useMemo, useCallback } from "react";
import styled from "styled-components";
import { open } from "@ledgerhq/live-common/lib/hw";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import manager from "@ledgerhq/live-common/lib/manager";
import {
  listApps,
  useAppsRunner,
  execWithTransport,
  getActionPlan
} from "@ledgerhq/live-common/lib/apps";
import { prettyActionPlan } from "@ledgerhq/live-common/lib/apps/mock";

const CryptoName = styled.div`
  padding: 6px;
  font-size: 12px;
  font-weight: bold;
`;

const AppPreview = ({ app }: *) => {
  return (
    <>
      <img alt="" src={manager.getIconUrl(app.icon)} width={40} height={40} />
      <CryptoName>{`${app.name} ${app.version}`}</CryptoName>
    </>
  );
};

const ConnectDevice = ({
  onConnect,
  loading
}: {
  onConnect: (*) => *,
  loading?: boolean
}) => {
  const onClick = useCallback(
    async e => {
      const transport = await open(e.target.name);
      await onConnect(transport);
    },
    [onConnect]
  );
  return (
    <div>
      <h1>Please connect your device</h1>
      {loading ? (
        "loading..."
      ) : (
        <div>
          <button name="webusb" onClick={onClick}>
            CONNECT webusb
          </button>
          <button name="webble" onClick={onClick}>
            CONNECT webble
          </button>
        </div>
      )}
    </div>
  );
};

const InstalledApp = ({
  name,
  updated,
  scheduled,
  dispatch,
  progress,
  error
}) => {
  const onInstall = useCallback(() => dispatch({ type: "install", name }), [
    dispatch,
    name
  ]);
  const onUninstall = useCallback(() => dispatch({ type: "uninstall", name }), [
    dispatch,
    name
  ]);
  return (
    <div style={{ padding: 5 }}>
      <strong>{name}</strong>
      {error ? <em style={{ color: "red" }}>{String(error)}</em> : null}
      {progress || scheduled ? (
        <div>
          {progress ? (
            <progress value={progress.progress} />
          ) : (
            <progress style={{ opacity: 0.3 }} />
          )}
          <button
            onClick={
              (progress ? progress.appOp : scheduled).type === "install"
                ? onUninstall
                : onInstall
            }
          >
            x
          </button>
        </div>
      ) : (
        <div>
          {updated ? null : <button onClick={onInstall}>update</button>}
          <button onClick={onUninstall}>uninstall</button>
        </div>
      )}
    </div>
  );
};

const AppItem = ({
  app,
  installed,
  installedAvailable,
  scheduled,
  dispatch,
  progress,
  error
}) => {
  const { name } = app;
  const onInstall = useCallback(() => dispatch({ type: "install", name }), [
    dispatch,
    name
  ]);
  const onUninstall = useCallback(() => dispatch({ type: "uninstall", name }), [
    dispatch,
    name
  ]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: 5
      }}
    >
      <AppPreview app={app} />
      {error ? <em style={{ color: "red" }}>{String(error)}</em> : null}
      {progress || scheduled ? (
        <div>
          {progress ? (
            <progress value={progress.progress} />
          ) : (
            <progress style={{ opacity: 0.3 }} />
          )}
          <button
            onClick={
              (progress ? progress.appOp : scheduled).type === "install"
                ? onUninstall
                : onInstall
            }
          >
            x
          </button>
        </div>
      ) : (
        <div>
          {installed || !installedAvailable ? (
            <button onClick={onUninstall}>uninstall</button>
          ) : null}
          {!installed || !installedAvailable ? (
            <button onClick={onInstall}>install</button>
          ) : null}
        </div>
      )}
    </div>
  );
};

const Main = ({ transport, deviceInfo, listAppsRes }) => {
  const exec = useMemo(() => execWithTransport(transport), [transport]);
  const [state, dispatch] = useAppsRunner(listAppsRes, exec);
  const { currentProgress, currentError } = state;
  const onUpdateAll = useCallback(() => dispatch({ type: "updateAll" }), [
    dispatch
  ]);
  const plan = getActionPlan(state);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ width: 300 }}>
        <div>Firmware {deviceInfo.version}</div>
        <div>{prettyActionPlan(plan)}</div>
        <div>
          <button onClick={onUpdateAll}>UPDATE ALL</button>
        </div>
        <div>
          {state.installed.map(({ name, updated }) => (
            <InstalledApp
              scheduled={plan.find(a => a.name === name)}
              progress={
                currentProgress && currentProgress.appOp.name === name
                  ? currentProgress
                  : null
              }
              error={
                currentError && currentError.appOp.name === name
                  ? currentError.error
                  : null
              }
              name={name}
              updated={updated}
              dispatch={dispatch}
              installedAvailable={state.installedAvailable}
            />
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div>
          {state.apps.map(app => (
            <AppItem
              scheduled={plan.find(a => a.name === app.name)}
              app={app}
              progress={
                currentProgress && currentProgress.appOp.name === app.name
                  ? currentProgress
                  : null
              }
              error={
                currentError && currentError.appOp.name === app.name
                  ? currentError.error
                  : null
              }
              installed={state.installed.find(ins => ins.name === app.name)}
              dispatch={dispatch}
              installedAvailable={state.installedAvailable}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Manager = () => {
  const [transport, setTransport] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [listAppsRes, setListAppsRes] = useState(null);

  const onConnect = useCallback(async transport => {
    setTransport(transport);
    let disconnected = false;
    transport.on("disconnect", () => {
      disconnected = true;
      setTransport(null);
    });
    const deviceInfo = await getDeviceInfo(transport);
    if (disconnected) return;
    setDeviceInfo(deviceInfo);
    const listAppsRes = await listApps(transport, deviceInfo);
    if (disconnected) return;
    setListAppsRes(listAppsRes);
  }, []);

  if (!transport) {
    return <ConnectDevice onConnect={onConnect} />;
  }

  if (!listAppsRes || !deviceInfo) {
    return <ConnectDevice onConnect={onConnect} loading />;
  }

  return (
    <Main
      transport={transport}
      deviceInfo={deviceInfo}
      listAppsRes={listAppsRes}
    />
  );
};

Manager.demo = {
  title: "Manager",
  url: "/manager",
  hidden: true
};

export default Manager;
