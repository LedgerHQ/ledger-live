import { PageShell } from "./PageShell";
import {
  FirmwareAppDeploymentsActions,
  FirmwareAppDeploymentsView,
} from "./FirmwareAppDeploymentsView";
import { useFirmwareAppDeploymentsViewModel } from "./useFirmwareAppDeploymentsViewModel";

export default function FirmwareAppDeployments() {
  const viewModel = useFirmwareAppDeploymentsViewModel();

  return (
    <PageShell
      title="Firmware App Deployments"
      actions={
        <FirmwareAppDeploymentsActions
          matrix={viewModel.matrix}
          status={viewModel.status}
          refreshing={viewModel.refreshing}
          onRefresh={viewModel.onRefresh}
        />
      }
    >
      <FirmwareAppDeploymentsView {...viewModel} />
    </PageShell>
  );
}
