import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";

type ConnectingStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.Connecting }>;
};

export function ConnectingState(_props: Readonly<ConnectingStateProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-center gap-16 px-16 py-32">
      <Spinner size={32} />
      <h3 className="heading-4-semi-bold text-center text-base">
        {t("deviceIntentExecutor.connectDevice.states.connecting.title")}
      </h3>
    </div>
  );
}
