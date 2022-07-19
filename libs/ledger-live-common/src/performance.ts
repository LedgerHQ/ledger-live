// Provide helpers to track performance spans through our internal logs
import { log, listen } from "@ledgerhq/logs";

type Unsubscribe = () => void;

export function connectLogsToSentry(Sentry: any): Unsubscribe {
  let apduSpan;
  const spans = {};
  return listen((l) => {
    if (!l) return;
    if (l.type === "apdu") {
      if (l.message?.startsWith("=>")) {
        const t = Sentry.getCurrentHub().getScope().getSpan();
        apduSpan = t?.startChild({
          op: "apdu",
          description: l.message.slice(0, 11),
        });
      } else if (l.message?.startsWith("<=")) {
        apduSpan?.finish();
      }
    } else if (l.type === "perf-span") {
      const { data } = l;
      if (!data) return;
      const { id, starts, span } = data;
      if (starts) {
        const t = Sentry.getCurrentHub().getScope().getSpan();
        spans[id] = t?.startChild({ ...span, description: l.message || "" });
      } else {
        const span = spans[id];
        span?.finish();
      }
    }
  });
}

let idCounter = 0;
export function startSpan(
  op: string,
  description?: string,
  rest?: {
    tags?: any;
    data?: any;
  }
): {
  finish: () => void;
} {
  let id = ++idCounter;
  const span: any = { op, ...rest };
  log("perf-span", description || "", {
    id,
    starts: true,
    span,
  });
  return {
    finish: () => {
      if (!id) return;
      log("perf-span", description || "", { id });
      id = 0;
    },
  };
}
