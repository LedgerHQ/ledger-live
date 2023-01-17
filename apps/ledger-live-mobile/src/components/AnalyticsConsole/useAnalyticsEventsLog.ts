import { useState, useCallback, useEffect, useRef } from "react";
import { map } from "rxjs/operators";
import { trackSubject } from "../../analytics/segment";
import { LoggableEventRenderable } from "./types";

type FilterFunction = (
  curr: LoggableEventRenderable,
  prev: LoggableEventRenderable,
) => LoggableEventRenderable;

export default function useAnalyticsEventsLog() {
  const id = useRef(0);
  const [items, setItems] = useState<LoggableEventRenderable[]>([]);
  const filter: FilterFunction = useCallback((curr, prev) => {
    if (!prev || !curr.eventProperties) return curr;
    // We repeat a bunch of data over and over again, filter that out unless it changes.
    // Will only work for flat props.
    const keys = Object.keys(curr.eventProperties).filter(
      k => curr?.eventProperties[k] !== prev?.eventProperties[k],
    );
    const eventProperties = keys.reduce(
      (ret, key) => ({ ...ret, [key]: curr.eventProperties[key] }),
      {},
    );
    return { ...curr, eventProperties };
  }, []);
  const addItem = useCallback(item => {
    console.log({ addItem: item });
    setItems(currentItems => [...currentItems.slice(-9), item]);
  }, []);
  useEffect(() => {
    const subscription = trackSubject
      .pipe(map(item => ({ ...item, id: ++id.current, date: new Date() })))
      .subscribe(addItem);
    return () => subscription.unsubscribe();
  }, [addItem]);

  return {
    items,
    filter,
  };
}
