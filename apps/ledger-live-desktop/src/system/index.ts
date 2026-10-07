import { bootstrap } from "~/renderer/bridge";

// Not os-browserify: it reports type() "Browser" and an empty hostname().
export const osType = (): string => bootstrap.os.type;

export const osRelease = (): string => bootstrap.os.release;

export const osPlatform = (): string => bootstrap.os.platform;

export const osHostname = (): string => bootstrap.os.hostname;
