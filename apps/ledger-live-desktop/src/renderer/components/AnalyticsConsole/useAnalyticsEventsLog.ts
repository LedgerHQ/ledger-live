import { useState, useCallback, useEffect, useRef } from "react";
import { map } from "rxjs/operators";
import { trackSubject } from "../../analytics/segment";
import { LoggableEventRenderable } from "./types";

export default function useAnalyticsEventsLog(limit = 40) {
  const id = useRef(0);
  const [items, setItems] = useState<LoggableEventRenderable[]>([]);
  const addItem = useCallback(
    item => {
      setItems(currentItems => [...currentItems.slice(-(limit - 1)), item]);
    },
    [limit],
  );
  useEffect(() => {
    const subscription = trackSubject
      .pipe(map(item => ({ ...item, id: ++id.current })))
      .subscribe(addItem);
    return () => subscription.unsubscribe();
  }, [addItem]);

  return {
    items,
  };
}
