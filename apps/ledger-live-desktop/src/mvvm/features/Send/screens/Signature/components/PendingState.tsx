import React from "react";
import { useTranslation } from "react-i18next";
import { InfiniteLoader } from "@ledgerhq/react-ui";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type PendingStateProps = Readonly<{
  messageKey: string;
}>;

export const PendingState = ({ messageKey }: PendingStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <DeviceBlocker />
      <div className="flex flex-col items-center gap-20">
        <div className="flex items-center justify-center rounded-full">
          <InfiniteLoader size={58} />
        </div>
        <p className="text-center text-base heading-4-semi-bold">{t(messageKey)}</p>
      </div>
    </div>
  );
};
