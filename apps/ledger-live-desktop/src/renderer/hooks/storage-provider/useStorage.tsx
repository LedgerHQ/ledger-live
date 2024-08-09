import React, { createContext, useContext } from "react";
import { DesktopStorageProvider } from "./DesktopStorageProvider";

const StorageContext = createContext(new DesktopStorageProvider());

export const useStorageProvider = () => {
  return useContext(StorageContext);
};

type Props = {
  children: React.ReactNode;
};

export function StorageProvider({ children }: Props) {
  const storage = useStorageProvider();
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}
