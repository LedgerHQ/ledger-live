import type { z } from "zod";
import type { UnreadableRecord } from "../types";
import { describeIssues } from "./schemaFailure";

export function parseEach<Schema extends z.ZodType>(
  schema: Schema,
  items: readonly unknown[],
  idField: string,
): { records: z.output<Schema>[]; unreadable: UnreadableRecord[] } {
  const records: z.output<Schema>[] = [];
  const unreadable: UnreadableRecord[] = [];
  for (const item of items) {
    const parsed = schema.safeParse(item);
    if (parsed.success) {
      records.push(parsed.data);
    } else {
      const id = readStringField(item, idField);
      const issues = describeIssues(parsed.error.issues);
      unreadable.push(id === undefined ? { issues } : { id, issues });
    }
  }
  return { records, unreadable };
}

function readStringField(item: unknown, field: string): string | undefined {
  if (typeof item !== "object" || item === null) return undefined;
  const value: unknown = Reflect.get(item, field);
  return typeof value === "string" ? value : undefined;
}
