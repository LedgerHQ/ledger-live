import type { ServiceEntryPointId } from "../../types";

export type ServicesEntryPointsViewProps = Readonly<{
  services: readonly ServiceEntryPointId[];
  onOpenService: (service: ServiceEntryPointId) => void;
}>;
