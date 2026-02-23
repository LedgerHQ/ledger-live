import React from "react";
import { UpdaterContext, UpdaterContextType } from "~/renderer/components/Updater/UpdaterContext";

export const defaultContext: UpdaterContextType = {
  status: "idle",
  downloadProgress: 0,
  version: "2.0.0",
  quitAndInstall: jest.fn(),
  setStatus: jest.fn(),
  error: null,
};

export const createContextWrapper = (overrides: Partial<UpdaterContextType> = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      UpdaterContext.Provider,
      { value: { ...defaultContext, ...overrides } },
      children,
    );
  Wrapper.displayName = "UpdaterTestWrapper";
  return Wrapper;
};
