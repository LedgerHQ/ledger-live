import type { ServiceEntryPointId } from "../../types";

export type ServicesEntryPointsViewProps = Readonly<{
  services: readonly ServiceEntryPointId[];
  onPressService: (service: ServiceEntryPointId) => void;
}>;
