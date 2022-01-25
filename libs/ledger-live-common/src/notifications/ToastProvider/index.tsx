import React, { useState, useMemo, useContext, ReactElement } from "react";
import type { ToastData } from "./types";
type Props = {
  children: React.ReactNode;
};
type ToastContextApi = {
  dismissToast: (arg0: string) => void;
  pushToast: (arg0: ToastData) => void;
};
type ToastContextState = {
  toasts: ToastData[];
};
type ToastContextType = ToastContextApi & ToastContextState;
const ToastContext = React.createContext<ToastContextType>({
  dismissToast: () => {},
  pushToast: () => {},
  toasts: [],
});

export function useToasts(): ToastContextType {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: Props): ReactElement {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const api = useMemo(
    () => ({
      dismissToast: (id: string) => {
        setToasts((currentToasts) => {
          return currentToasts.find((item) => item.id === id)
            ? currentToasts.filter((item) => item.id !== id)
            : currentToasts;
        });
      },
      pushToast: (newToast: ToastData) => {
        setToasts((currentToasts) => [...currentToasts, newToast]);
      },
    }),
    []
  );
  const value = {
    toasts,
    ...api,
  };
  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}
