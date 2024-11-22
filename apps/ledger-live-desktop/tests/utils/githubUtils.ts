export function isRunningInScheduledWorkflow(): boolean {
  return process.env.GITHUB_ACTIONS === "true" && process.env.GITHUB_EVENT_NAME === "schedule";
}
