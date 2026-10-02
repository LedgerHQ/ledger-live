import os from "node:os";

// Not os-browserify: it reports type() "Browser" and an empty hostname().
export const osType = (): string => os.type();

export const osRelease = (): string => os.release();

export const osPlatform = (): string => os.platform();

export const osHostname = (): string => os.hostname();
