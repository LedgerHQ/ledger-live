import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { OsUpdatesOrchestratorComponent } from "@ledgerhq/live-common/os-update/components/OsUpdatesOrchestratorComponent";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import { TrackingProvider } from "../../analytics/TrackingProvider";
import { osUpdatePlatformComponents } from "../../components/osUpdatePlatformComponents";
import { WhatsNewScreen } from "../WhatsNewScreen";
import { useOsUpdateFlowViewModel } from "./useOsUpdateFlowViewModel";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.OsUpdate>;

export default function OsUpdateFlow({ route }: Props) {
  const { whatsNew, orchestratorRun, onConfirmStart, onOpenReleaseNotes, onClose, analytics } =
    useOsUpdateFlowViewModel(route.params.device, route.params.mode);

  const content = (() => {
    if (orchestratorRun) {
      return (
        <Box lx={{ flex: 1 }}>
          <PreventNativeBack />
          <OsUpdatesOrchestratorComponent
            {...orchestratorRun}
            platformComponents={osUpdatePlatformComponents}
          />
        </Box>
      );
    }

    if (whatsNew) {
      return (
        <WhatsNewScreen
          version={whatsNew.version}
          notes={whatsNew.notes}
          onOpenReleaseNotes={onOpenReleaseNotes}
          onStart={onConfirmStart}
          onClose={onClose}
        />
      );
    }

    return null;
  })();

  if (!analytics) return content;
  return <TrackingProvider {...analytics}>{content}</TrackingProvider>;
}
