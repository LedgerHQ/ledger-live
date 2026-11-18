import type { ReceiveServiceIncident } from "../types";

export type StatusPageIncident = Readonly<{
  name: string;
  components?: readonly unknown[] | null;
  incident_updates?: readonly Readonly<{ body?: string }>[] | null;
}>;

export function toReceiveServiceIncidents(
  incidents: readonly StatusPageIncident[],
): readonly ReceiveServiceIncident[] {
  return incidents
    .filter(incident => (incident.components?.length ?? 0) > 0)
    .map(incident => ({
      title: incident.name,
      description: incident.incident_updates?.[0]?.body,
    }));
}
