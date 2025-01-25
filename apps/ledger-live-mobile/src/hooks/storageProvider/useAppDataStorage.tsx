import React from "react";
import { MobileAppDataStorageProvider } from "./MobileAppDataStorageProvider";

const StorageContext = React.createContext(new MobileAppDataStorageProvider());

export const useAppDataStorage = () => {
  return React.useContext(StorageContext);
};

type Props = {
  children: React.ReactNode;
};

export function AppDataStorageProvider({ children }: Props) {
  const storage = useAppDataStorage();
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}
