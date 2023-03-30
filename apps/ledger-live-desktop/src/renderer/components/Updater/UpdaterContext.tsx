import { ipcRenderer, IpcRendererEvent } from "electron";
import React, { Component } from "react";
export type UpdateStatus =
  | "idle"
  | "checking-for-update"
  | "update-available"
  | "update-not-available"
  | "download-progress"
  | "update-downloaded"
  | "checking"
  | "check-success"
  | "downloading-update"
  | "error";
export type UpdaterContextType = {
  status: UpdateStatus;
  downloadProgress: number;
  version: string | undefined | null;
  quitAndInstall: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  setStatus: (a: UpdateStatus) => void;
  error: Error | undefined | null;
};
export type MaybeUpdateContextType = UpdaterContextType | undefined | null;
type UpdaterProviderProps = {
  children: any;
};
type UpdaterProviderState = {
  status: UpdateStatus;
  downloadProgress: number;
  version?: string;
  error: Error | undefined | null;
};
export const UpdaterContext = React.createContext<MaybeUpdateContextType>(null);
class Provider extends Component<UpdaterProviderProps, UpdaterProviderState> {
  constructor() {
    super();
    ipcRenderer.on("updater", this.listener);
    if (!__DEV__) {
      ipcRenderer.send("updater", "init");
    }
    this.state = {
      status: "idle",
      downloadProgress: 0,
      error: null,
      version: process.env.DEBUG_UPDATE ? "1.2.3" : undefined,
    };
  }

  componentWillUnmount() {
    ipcRenderer.removeListener("updater", this.listener);
  }

  listener = (
    e: IpcRendererEvent,
    args: {
      status: UpdateStatus;
      payload?: {
        percent?: number;
        version?: string;
      };
    },
  ) => {
    if (args.status === "download-progress") {
      const downloadProgress =
        args.payload && args.payload.percent ? +args.payload.percent.toFixed(0) : 0;
      this.setState({
        status: args.status,
        downloadProgress,
      });
    } else if (args.status === "update-available") {
      this.setState({
        status: args.status,
        version: args.payload ? args.payload.version : undefined,
      });
    } else {
      this.setStatus(args.status);
    }
  };

  setStatus = (status: UpdateStatus) => {
    this.setState({
      status,
    });
  };

  setDownloadProgress = (downloadProgress: number) =>
    this.setState({
      downloadProgress,
    });

  quitAndInstall = () => ipcRenderer.send("updater", "quit-and-install");
  downloadUpdate = () => {
    this.setStatus("downloading-update");
    return ipcRenderer.send("updater", "download-update");
  };

  render() {
    const { status, downloadProgress, error, version } = this.state;
    const value = {
      status,
      version,
      downloadProgress,
      error,
      setStatus: this.setStatus,
      quitAndInstall: this.quitAndInstall,
      downloadUpdate: this.downloadUpdate,
    };
    return <UpdaterContext.Provider value={value}>{this.props.children}</UpdaterContext.Provider>;
  }
}
export const withUpdaterContext = (ComponentToDecorate: React$ComponentType<any>) => {
  const WrappedUpdater = (props: any) => (
    <UpdaterContext.Consumer>
      {context => <ComponentToDecorate {...props} context={context} />}
    </UpdaterContext.Consumer>
  );
  return WrappedUpdater;
};
export const UpdaterProvider = Provider;
