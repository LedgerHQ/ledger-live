import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { OsUpdatesOrchestratorComponent } from "@ledgerhq/live-common/os-update/components/OsUpdatesOrchestratorComponent";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import { osUpdatePlatformComponents } from "../../components/osUpdatePlatformComponents";
import { WhatsNewScreen } from "../WhatsNewScreen";
import { useOsUpdateFlowViewModel } from "./useOsUpdateFlowViewModel";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.OsUpdate>;

export default function OsUpdateFlow({ route }: Props) {
  const { whatsNew, orchestratorRun, onConfirmStart, onClose } = useOsUpdateFlowViewModel(
    route.params.device,
    route.params.mode,
  );

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
        onStart={onConfirmStart}
        onClose={onClose}
      />
    );
  }

  return null;
}
