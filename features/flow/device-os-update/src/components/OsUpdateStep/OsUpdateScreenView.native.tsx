import React from "react";
import type { OsUpdateDeviceView } from "../../hooks/useOsUpdateDevice";
import { PreparingScreen } from "../../screens/Preparing/PreparingScreen";
import { FINISHING_ANIMATION_MS } from "../../screens/UpdateProgress/components/ProgressBar";
import { UpdateProgressScreen } from "../../screens/UpdateProgress/UpdateProgressScreen";
import { UpdatesAppliedScreen } from "../../screens/UpdatesApplied/UpdatesAppliedScreen";
import type { OsUpdateScreen } from "../../types/OsUpdateScreen";

type Props = Readonly<{ screen: OsUpdateScreen; device: OsUpdateDeviceView }>;

export function OsUpdateScreenView({ screen, device: { productName } }: Props) {
  switch (screen.type) {
    case "preparing":
      return <PreparingScreen />;
    case "progress":
      return (
        <UpdateProgressScreen
          productName={productName}
          progress={screen.progress}
          isRestoring={screen.isRestoring}
          update={screen.update}
          initialProgress={screen.finishing?.from}
          progressAnimationMs={screen.finishing ? FINISHING_ANIMATION_MS : undefined}
          onProgressAnimationEnd={screen.finishing?.onFinished}
        />
      );
    case "applied":
      return screen.isRestoreOnly ? (
        <UpdatesAppliedScreen
          productName={productName}
          isRestoreOnly
          restoreStatus={screen.restoreStatus}
          onClose={screen.onClose}
        />
      ) : (
        <UpdatesAppliedScreen
          productName={productName}
          isRestoreOnly={false}
          osVersion={screen.osVersion}
          restoreStatus={screen.restoreStatus}
          onClose={screen.onClose}
        />
      );
    default: {
      const unhandled: never = screen;
      return unhandled;
    }
  }
}
