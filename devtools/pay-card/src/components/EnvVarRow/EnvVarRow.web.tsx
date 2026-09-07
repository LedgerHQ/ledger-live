import { useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { PayCardEnvVar } from "../../types";

export interface EnvVarRowProps {
  readonly envVar: PayCardEnvVar;
  readonly onSet: (key: string, value: string) => void;
}

export function EnvVarRow({ envVar, onSet }: EnvVarRowProps) {
  // Starts on the value the tester switches to, so the other tenant is one click away.
  const [draft, setDraft] = useState(envVar.suggestedValue);

  return (
    <div className="flex flex-col gap-2">
      <p className="body-4 text-base break-all">
        {`${envVar.key}=${envVar.value === "" ? "(empty)" : envVar.value}`}
      </p>
      <div className="flex items-center gap-8">
        <input
          type="text"
          value={draft}
          onChange={event => setDraft(event.target.value)}
          aria-label={envVar.key}
          className="flex-1 bg-base border border-base rounded px-8 py-4 body-3 text-base"
        />
        <Button appearance="gray" size="sm" onClick={() => onSet(envVar.key, draft)}>
          Set
        </Button>
      </div>
    </div>
  );
}
