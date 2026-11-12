import { useCallback, useState } from "react";

type Outcome = { isError: boolean; message: string };

export function useAction() {
  const [isRunning, setIsRunning] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>();

  const run = useCallback((action: () => Promise<void>, done?: string) => {
    setIsRunning(true);
    setOutcome(undefined);
    action()
      .then(
        () => setOutcome(done === undefined ? undefined : { isError: false, message: done }),
        (error: unknown) =>
          setOutcome({
            isError: true,
            message: `Failed: ${error instanceof Error ? error.message : String(error)}`,
          }),
      )
      .finally(() => setIsRunning(false));
  }, []);

  return { isRunning, outcome, run };
}
