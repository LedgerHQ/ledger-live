import type { ServiceEntryPointId } from "../types";
import type { ServicesAvailability } from "../types.internals";

function isServiceEntryPointId(
  value: unknown,
  availability: ServicesAvailability,
): value is ServiceEntryPointId {
  return typeof value === "string" && Object.hasOwn(availability, value);
}

export function resolveServices(
  order: readonly unknown[] | undefined,
  availability: ServicesAvailability,
): ServiceEntryPointId[] {
  if (!Array.isArray(order)) return [];

  const services = new Set<ServiceEntryPointId>();
  for (const value of order) {
    if (isServiceEntryPointId(value, availability) && availability[value]) {
      services.add(value);
    }
  }
  return [...services];
}
