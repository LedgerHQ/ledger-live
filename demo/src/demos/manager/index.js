// @flow
import React, { useState, useMemo, useCallback } from "react";
import styled from "styled-components";
import { open } from "@ledgerhq/live-common/lib/hw";
import { getDeviceModel } from "@ledgerhq/devices";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import manager from "@ledgerhq/live-common/lib/manager";
import {
  listApps,
  useAppsRunner,
  execWithTransport,
  getActionPlan
} from "@ledgerhq/live-common/lib/apps";
import { prettyActionPlan } from "@ledgerhq/live-common/lib/apps/mock";
import { StorageBar, DeviceIllustration } from "./DeviceStorage";
import { distribute } from "./sizes";

const Container = styled.div`
  width: 600px;
  margin: 20px auto;
  font-family: Inter, sans-serif;
`;

const AppRow = styled.div`
  display: flex;
  flex-sirection: row;
  align-items: center;
  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
  margin-bottom: 10px;
  padding-bottom: 10px;
  font-size: 12px;
`;

const AppName = styled.div`
  flex-direction: column;
  padding-left: 10px;
  flex: 1;
`;

const CryptoName = styled.div`
  font-weight: bold;
  padding: 2px 0;
`;

const CryptoVersion = styled.div`
  color: #999;
  padding: 2px 0;
`;

const AppActions = styled.div`
  > *:not(:last-child) {
    margin-right: 10px;
  }
`;

const Progress = ({ value }) => (
  <div
    style={{
      width: 90,
      height: 5,
      background: "#E6E6E6",
      position: "relative",
      borderRadius: 5
    }}
  >
    <div
      style={{
        position: "absolute",
        background: "#6490F1",
        height: "100%",
        borderRadius: 5,
        width: (value * 100).toFixed(2) + "%"
      }}
    />
  </div>
);

const Button = styled.button`
  padding: 12px 16px;
  border: none;
  background: ${p =>
    p.danger
      ? "#FF483820"
      : p.primary
      ? "#6490F1"
      : "rgba(100, 144, 241, 0.1)"};
  color: ${p => (p.danger ? "#FF4838" : p.primary ? "#fff" : "#6490F1")};
  border-radius: 4px;
  &:hover {
    opacity: 0.8;
  }
`;

const AppPreview = ({ app }: *) => (
  <img alt="" src={manager.getIconUrl(app.icon)} width={40} height={40} />
);

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
    <AppRow>
      <AppPreview app={app} />
      <AppName>
        <CryptoName>{`${app.name}${
          app.currency ? ` (${app.currency.ticker})` : ""
        }`}</CryptoName>
        <CryptoVersion>{`Version ${app.version}`}</CryptoVersion>
      </AppName>
      {error ? (
        <Button danger style={{ color: "red" }} title={String(error)}>
          !
        </Button>
      ) : progress || scheduled ? (
        <div style={{ textAlign: "right" }}>
          {progress ? (
            <div style={{ color: "#6490F1", marginBottom: 5 }}>Updating...</div>
          ) : (
            <div
              style={{
                display: "inline-block",
                marginBottom: 5,
                opacity: 0.5,
                cursor: "pointer"
              }}
              onClick={
                (progress ? progress.appOp : scheduled).type === "install"
                  ? onUninstall
                  : onInstall
              }
            >
              Cancel
            </div>
          )}
          <Progress value={progress ? progress.progress : 0} />
        </div>
      ) : (
        <AppActions>
          {installed || !installedAvailable ? (
            <Button danger onClick={onUninstall}>
              Uninstall
            </Button>
          ) : null}
          {installed && !installed.updated ? (
            <Button primary onClick={onInstall}>
              Update
            </Button>
          ) : !installed ? (
            <Button onClick={onInstall}>Install</Button>
          ) : null}
        </AppActions>
      )}
    </AppRow>
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

  // $FlowFixMe
  const deviceModel = transport.deviceModel || getDeviceModel("nanoS");

  // eslint-disable-next-line no-console
  console.log(state);

  const mapApp = app => (
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
  );

  const installedApps = state.installed
    .map(i => state.apps.find(a => a.name === i.name))
    .filter(Boolean);
  const nonInstalledApps = state.apps.filter(a => !installedApps.includes(a));

  // TODO HACK we need installedApps to actually hodl the bytes info
  const apps = installedApps.map(a => state.appByName[a.name]).filter(Boolean);

  const distribution = distribute({ deviceModel, deviceInfo, apps });

  return (
    <Container>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <DeviceIllustration deviceModel={deviceModel} />
        <div style={{ flex: 1, paddingLeft: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <strong>{deviceModel.productName}</strong>
          </div>
          <div style={{ marginBottom: 20 }}>Firmware {deviceInfo.version}</div>
          <StorageBar distribution={distribution} />
        </div>
      </div>
      <h2>
        {"On Device "}
        <Button onClick={onUpdateAll}>Update all</Button>
      </h2>

      {!state.installedAvailable ? (
        <div style={{ color: "red" }}>HSM list apps not available!!</div>
      ) : null}

      <div>
        {installedApps.length
          ? installedApps.map(mapApp)
          : "No apps installed."}
      </div>

      <div style={{ fontSize: "10px", opacity: 0.3 }}>
        {prettyActionPlan(plan)}
      </div>

      <h2>Apps Store</h2>

      <div>{nonInstalledApps.map(mapApp)}</div>
    </Container>
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
    <Container>
      <h1>Please connect your device</h1>
      {loading ? (
        "loading..."
      ) : (
        <AppActions>
          <Button primary name="webusb" onClick={onClick}>
            USB
          </Button>
          <Button name="webhid" onClick={onClick}>
            WebHID
          </Button>
          <Button name="webble" onClick={onClick}>
            Bluetooth
          </Button>
        </AppActions>
      )}
    </Container>
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
