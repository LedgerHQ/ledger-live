// Type guard to check if the action has the expected shape
export function isActionWithType(action: unknown): action is { type: string; payload?: unknown } {
  return (
    typeof action === "object" &&
    action !== null &&
    "type" in action &&
    typeof action.type === "string"
  );
}
