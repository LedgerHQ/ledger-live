import { Pill } from "../pill/Pill";

export interface KeyListSummaryProps {
  readonly overrideCount: number;
  readonly totalCount: number;
  readonly filteredCount: number;
}

export function KeyListSummary({ overrideCount, totalCount, filteredCount }: KeyListSummaryProps) {
  return (
    <div className="flex items-center gap-2 bg-canvas-muted p-8">
      <Pill variant="muted" size={3}>
        <div className="flex gap-10">
          <p className="body-3-semi-bold text-base">{filteredCount}</p>
          <p>of</p>
          <p>{totalCount}</p>
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
  );
}
