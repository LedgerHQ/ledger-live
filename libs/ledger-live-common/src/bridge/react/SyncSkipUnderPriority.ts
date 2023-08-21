import { useEffect } from "react";
import { useBridgeSync } from "./context";

type Instance = {
  priority: number;
};

const SyncSkipUnderPriorityInstances: Array<Instance> = [];
export const SyncSkipUnderPriority = ({ priority }: { priority: number }) => {
  const sync = useBridgeSync();
  useEffect(() => {
    const instance = {
      priority,
    };
    SyncSkipUnderPriorityInstances.push(instance);

    const update = () => {
      // among all the available priorities, we set the highest
      // if there is no longer SyncSkipUnderPriority mounted, we go back to -1
      const priority =
        SyncSkipUnderPriorityInstances.length === 0
          ? -1
          : Math.max(...SyncSkipUnderPriorityInstances.map(i => i.priority));
      sync({
        type: "SET_SKIP_UNDER_PRIORITY",
        priority,
      });
    };

    update();
    return () => {
      const i = SyncSkipUnderPriorityInstances.indexOf(instance);
      if (i === -1) return;
      SyncSkipUnderPriorityInstances.splice(i, 1);
      update();
    };
  }, [sync, priority]);
  return null;
};
