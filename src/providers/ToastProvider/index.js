// @flow

import React, { useState, useMemo, useContext } from "react";
import type { ToastData } from "./types";

type Props = {
  children: React$Node,
};

type ToastContextApi = {
  dismissToast: (string) => void,
  pushToast: (ToastData) => void,
};

type ToastContextState = {
  toasts: ToastData[],
};

type ToastContextType = ToastContextApi & ToastContextState;

const ToastContext = React.createContext<ToastContextType>({});

export function useToasts(): ToastContextType {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: Props) {
  const [toasts, setToasts] = useState([]);

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
