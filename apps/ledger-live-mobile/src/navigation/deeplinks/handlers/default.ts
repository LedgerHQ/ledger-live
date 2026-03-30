import { getStateFromPath } from "@react-navigation/native";
import type { DeeplinkHandler } from "../types";

/**
 * Fallback handler for routes not covered by the registry.
 * Passes the raw path directly to React Navigation's getStateFromPath.
 */
export const defaultHandler: DeeplinkHandler = ({ rawPath }, { config }) => {
  return getStateFromPath(rawPath, config);
};
