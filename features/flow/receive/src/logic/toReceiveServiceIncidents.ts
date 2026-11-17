import type { ReceiveServiceIncident } from "../types";

/** An incident as status.ledger.com reports it. */
export type StatusPageIncident = Readonly<{
  name: string;
  components?: readonly unknown[] | null;
  incident_updates?: readonly Readonly<{ body?: string }>[] | null;
}>;

/** The incidents that affect a component, with their latest update. */
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
