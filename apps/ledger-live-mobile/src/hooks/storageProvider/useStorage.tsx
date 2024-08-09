import React from "react";
import { MobileStorageProvider } from "./MobileStorageProvider";

const StorageContext = React.createContext(new MobileStorageProvider());

export const useStorage = () => {
  return React.useContext(StorageContext);
};

type Props = {
  children: React.ReactNode;
};

export function StorageProvider({ children }: Props) {
  const storage = useStorage();
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}
