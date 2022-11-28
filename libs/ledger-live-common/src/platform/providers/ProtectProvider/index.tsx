import React, { createContext, useMemo, useState, useEffect } from "react";
import { refreshToken as refreshTokenMock } from "./api/api.mock";
import { ProtectData, ProtectStateNumberEnum } from "./types";

type ProtectProviderProps = {
  children: React.ReactNode;
};

type ProtectState = {
  session: {
    active: boolean;
    authToken: string | undefined;
    refreshToken: string | undefined;
  };
  protectState: ProtectStateNumberEnum;
};

type ProviderData = { state: ProtectState };

const initialState: ProtectState = {
  session: {
    active: false,
    authToken: undefined,
    refreshToken: undefined,
  },
  protectState: ProtectStateNumberEnum.NEW,
};

export const protectContext = createContext({
  state: initialState,
});

export function ProtectProvider(props: ProtectProviderProps): JSX.Element {
  const { children } = props;

  const [data, setData] = useState<ProtectData | undefined>(undefined);

  const value = useMemo<ProviderData>(() => {
    const providerData: ProviderData = { state: { ...initialState } };

    if (!data) return providerData;

    const protectData = data.services.protect;

    // TODO : remove when api is implemented
    return providerData;

    if (
      protectData.available &&
      !protectData.active &&
      !protectData.payment_due
    ) {
      providerData.state.protectState = ProtectStateNumberEnum.CONFIRM_IDENTITY;
    }

    if (
      protectData.available &&
      protectData.active &&
      protectData.payment_due
    ) {
      providerData.state.protectState = ProtectStateNumberEnum.ADD_PAYMENT;
    }

    if (
      protectData.available &&
      !protectData.active &&
      protectData.payment_due
    ) {
      providerData.state.protectState = ProtectStateNumberEnum.PAYMENT_REJECTED;
    }

    if (
      !protectData.available &&
      !protectData.active &&
      protectData.payment_due
    ) {
      providerData.state.protectState =
        ProtectStateNumberEnum.SUBSCRIPTION_CANCELED;
    }

    if (
      protectData.available &&
      protectData.active &&
      !protectData.payment_due
    ) {
      providerData.state.protectState = ProtectStateNumberEnum.ACTIVE;
    }

    return providerData;
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
