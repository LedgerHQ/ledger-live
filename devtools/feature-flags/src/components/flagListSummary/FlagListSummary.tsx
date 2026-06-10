import { Pill } from "../pill/Pill.web";

export interface FlagListSummaryProps {
  readonly overrideCount: number;
  readonly numberOfFlags: number;
  readonly numberOfFilteredFlags: number;
}

export function FlagListSummary({
  overrideCount,
  numberOfFlags,
  numberOfFilteredFlags,
}: FlagListSummaryProps) {
  return (
    <div className="flex justify-between items-center p-8 bg-canvas-muted">
      <div className="flex items-center gap-2">
        <Pill variant="muted" size={3}>
          <div className="flex gap-10">
            <p className="body-3-semi-bold text-base">{numberOfFilteredFlags}</p>
            <p>of</p>
            <p>{numberOfFlags}</p>
          </div>
        </Pill>
        {overrideCount > 0 && (
          <>
            <span className="text-muted">·</span>
            <Pill variant="active" size={3}>
              {overrideCount} overridden
            </Pill>
          </>
        )}
      </div>
    </div>
  );
}
