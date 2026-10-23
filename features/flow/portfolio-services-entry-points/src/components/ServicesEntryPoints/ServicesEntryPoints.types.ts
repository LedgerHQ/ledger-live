import type { ServiceEntryPointId } from "../../types";

export type ServicesEntryPointsProps = Readonly<{
  page: string;
  onOpenService: (service: ServiceEntryPointId) => void;
}>;
