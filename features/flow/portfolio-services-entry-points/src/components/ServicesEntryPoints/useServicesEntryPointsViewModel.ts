import { useCallback } from "react";
import { track } from "@shared/analytics";
import { useServicesEntryPointsFeature } from "../../hooks/useServicesEntryPointsFeature";
import type { ServiceEntryPointId } from "../../types";
import type { ServicesEntryPointsProps } from "./ServicesEntryPoints.types";
import type { ServicesEntryPointsViewProps } from "./ServicesEntryPointsView.types";

export function useServicesEntryPointsViewModel({
  page,
  onOpenService,
}: ServicesEntryPointsProps): ServicesEntryPointsViewProps {
  const { services } = useServicesEntryPointsFeature();

  const onPressService = useCallback(
    (service: ServiceEntryPointId) => {
      track("button_clicked", {
        button: `${service}_entry_point`,
        flow: service,
        page,
      });
      onOpenService(service);
    },
    [page, onOpenService],
  );

  return { services, onPressService };
}
