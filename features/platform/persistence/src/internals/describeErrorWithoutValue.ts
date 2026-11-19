import { RecordDecodeError } from "@shared/persistence";

/** A decode error says where the value is wrong, never what it is. Other errors give their name. */
export const describeErrorWithoutValue = (error: unknown): string => {
  if (error instanceof RecordDecodeError) return error.message;
  if (error instanceof Error) return error.name;
  return typeof error;
};
