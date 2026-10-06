import { createContext } from "react";
import type { CountervaluesBridge } from "../CountervaluesProvider";

/**
 * Base Countervalues Context to use without polling logic.
 */
export const CountervaluesContext = createContext<CountervaluesBridge | null>(null);
