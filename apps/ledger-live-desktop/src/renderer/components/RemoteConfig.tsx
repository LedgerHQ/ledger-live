import React, { useContext } from "react";
export type RemoteConfig = {
  data:
    | {
        "progressive-update": {
          [version: string]: {
            [platform: string]: number;
          };
        };
      }
    | undefined
    | null;
  error: any | undefined | null;
  lastUpdatedAt: Date | undefined | null;
};
const defaultValue: RemoteConfig = {
  data: null,
  error: new Error("RemoteConfig is no longer used"),
  lastUpdatedAt: new Date(),
};
export const RemoteConfigContext = React.createContext<RemoteConfig>(defaultValue);
export const useRemoteConfig = () => {
  return useContext(RemoteConfigContext);
};
type Props = {
  children: React.ReactNode;
};
export const RemoteConfigProvider = ({ children }: Props) => (
  <RemoteConfigContext.Provider value={defaultValue}>{children}</RemoteConfigContext.Provider>
);
