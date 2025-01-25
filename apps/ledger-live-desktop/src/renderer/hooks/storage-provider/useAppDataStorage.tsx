import React, { createContext, useContext } from "react";
import { DesktopAppDataStorageProvider } from "./DesktopAppDataStorageProvider";

const AppDataStorageContext = createContext(new DesktopAppDataStorageProvider());

export const useAppDataStorageProvider = () => {
  return useContext(AppDataStorageContext);
};

type Props = {
  children: React.ReactNode;
};

export function AppDataStorageProvider({ children }: Props) {
  const storage = useAppDataStorageProvider();
  return (
    <AppDataStorageContext.Provider value={storage}>{children}</AppDataStorageContext.Provider>
  );
}
