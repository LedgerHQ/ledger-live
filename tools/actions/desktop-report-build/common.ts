/**
 * List of all the possible desktop job os.
 */
export const DESKTOP_JOB_OS = {
  linux: {
    id: "linux",

    name: "Linux",
    symbol: "🐧",
  },
  win: {
    id: "win",

    name: "Windows",
    symbol: "🪟",
  },
  mac: {
    id: "mac",

    name: "macOS",
    symbol: "🍏",
  },
} as const;

/**
 * Object representing all the status for each desktop job os.
 */
export type DesktopJobsStatuses = { [K in keyof typeof DESKTOP_JOB_OS]?: string };

/**
 * Helper to convert a string to DesktopJobsStatuses.
 */
export const parseJobStatuses = (jsonStr: string): DesktopJobsStatuses => JSON.parse(jsonStr);

/**
 * Helper to know wether a job succeded.
 */
export const isSuccess = (status?: string) => status === "success";
