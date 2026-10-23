import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import type { ServiceEntryPointId } from "@features/flow-portfolio-services-entry-points";

export type PortfolioServicesEntryPointsViewModel = {
  onOpenService: (service: ServiceEntryPointId) => void;
};

export function usePortfolioServicesEntryPointsViewModel(): PortfolioServicesEntryPointsViewModel {
  const navigate = useNavigate();
  const location = useLocation();

  const onOpenService = useCallback(
    function onOpenService(service: ServiceEntryPointId) {
      switch (service) {
        case "perps":
          navigate("/perps");
          return;
        case "borrow":
          navigate("/borrow", { state: { returnTo: location.pathname } });
          return;
      }
    },
    [navigate, location.pathname],
  );

  return { onOpenService };
}
