import { ReplaySubject } from "rxjs";
import type { LoggableEvent } from "./types";

export const trackSubject = new ReplaySubject<LoggableEvent>(30);
