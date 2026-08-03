import { updater } from "~/renderer/bridge";
import type { UpdaterStatusEvent } from "~/bridge/contract";
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
  quitAndInstall: () => void;
  setStatus: (a: UpdateStatus) => void;
  error: Error | undefined | null;
};

export type MaybeUpdateContextType = UpdaterContextType | undefined | null;

type UpdaterProviderProps = {
  children: React.ReactNode;
};

type UpdaterProviderState = {
  status: UpdateStatus;
  downloadProgress: number;
  version?: string;
  error: Error | undefined | null;
};

export const UpdaterContext = React.createContext<MaybeUpdateContextType>(null);
class Provider extends Component<UpdaterProviderProps, UpdaterProviderState> {
  constructor(props: UpdaterProviderProps) {
    super(props);
    this.unsubscribe = updater.onStatus(this.listener);
    if (!__DEV__) {
      updater.init();
    }
    this.state = {
      status: "idle",
      downloadProgress: 0,
      error: null,
      version: process.env.DEBUG_UPDATE ? "1.2.3" : undefined,
    };
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  /** Returned by `onStatus`; the listener itself cannot be passed back across the bridge. */
  private unsubscribe?: () => void;

  // The bridge types `status` as a plain string, because the contract cannot import
  // renderer types. Narrowing back to UpdateStatus happens here.
  listener = (event: UpdaterStatusEvent) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const args = event as {
      status: UpdateStatus;
      payload?: { percent?: number; version?: string };
    };
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

  quitAndInstall = () => updater.quitAndInstall();

  render() {
    const { status, downloadProgress, error, version } = this.state;
    const value = {
      status,
      version,
      downloadProgress,
      error,
      setStatus: this.setStatus,
      quitAndInstall: this.quitAndInstall,
    };
    return <UpdaterContext.Provider value={value}>{this.props.children}</UpdaterContext.Provider>;
  }
}

export const UpdaterProvider = Provider;
