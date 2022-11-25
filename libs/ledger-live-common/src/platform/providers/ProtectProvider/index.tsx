import React, { createContext, useMemo, useState, useEffect } from "react";
import { refreshToken as refreshTokenMock } from "./api/api.mock";
import { ProtectData } from "./types";

type ProtectProviderProps = {
  children: React.ReactNode;
};

type InitialState = {
  session: {
    active: boolean;
    authToken: string | undefined;
    refreshToken: string | undefined;
  };
  protectState: ProtectStateNumber;
};

export type ProtectStateNumber = 800 | 900 | 1000 | 1100 | 1200;

// 800: "new",
// 900: "actionRequired",
// 1000: "paymentRejected",
// 1100: "subscriptionCanceled",
// 1200: "active",

const initialState: InitialState = {
  session: {
    active: false,
    authToken: undefined,
    refreshToken: undefined,
  },
  protectState: 800,
};

export const protectContext = createContext({
  state: initialState,
});

export function ProtectProvider(props: ProtectProviderProps): JSX.Element {
  const { children } = props;

  const [data, setData] = useState<ProtectData | undefined>(undefined);

  const value = useMemo(() => {
    let protectState: ProtectStateNumber = 800;

    const protectData = data?.services.protect;

    if (
      (protectData?.available, protectData?.active, protectData?.payment_due)
    ) {
      protectState = 1200;
    }

    return {
      state: {
        session: {
          active: false,
          authToken: data?.access_token,
          refreshToken: data?.refresh_token,
        },
        protectState,
      },
    };
  }, [data]);

  useEffect(() => {
    (async () => {
      const data = await refreshTokenMock();
      setData(data);
    })();
  }, []);

  return (
    <protectContext.Provider value={value}>{children}</protectContext.Provider>
  );
}
