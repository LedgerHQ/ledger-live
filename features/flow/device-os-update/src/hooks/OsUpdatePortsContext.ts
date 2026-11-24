import { createContext } from "react";
import type { OsUpdatePorts } from "../types/OsUpdatePorts";

export const OsUpdatePortsContext = createContext<OsUpdatePorts | null>(null);
