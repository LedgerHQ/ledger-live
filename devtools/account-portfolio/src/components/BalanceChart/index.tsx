import { Tag } from "@ledgerhq/lumen-ui-react";
import { formatCurrencyValue } from "../../utils/format";
import type { HistorySample } from "../../utils/historySeries";

const WIDTH = 600;
const HEIGHT = 160;
const PAD = 8;

const dateOf = (time: number) => new Date(time).toLocaleString();

function pathOf(samples: readonly HistorySample[]) {
  const first = samples[0].time;
  const span = samples[samples.length - 1].time - first || 1;
  const values = samples.map(sample => sample.value);
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const x = (time: number) => PAD + ((time - first) / span) * (WIDTH - 2 * PAD);
  const y = (value: number) => HEIGHT - PAD - ((value - min) / range) * (HEIGHT - 2 * PAD);
  const line = samples
    .map((sample, index) => `${index === 0 ? "M" : "L"}${x(sample.time)},${y(sample.value)}`)
    .join(" ");
  const area = `${line} L${x(samples[samples.length - 1].time)},${HEIGHT - PAD} L${x(first)},${HEIGHT - PAD} Z`;
  return { line, area };
}

/** The value of the portfolio over the range, as a line: the shape first, the numbers around it. */
export function BalanceChart({
  samples,
  currency,
}: Readonly<{ samples: readonly HistorySample[]; currency: string }>) {
  if (samples.length === 0) return null;

  const first = samples[0];
  const last = samples[samples.length - 1];
  const values = samples.map(sample => sample.value);
  const change = last.value - first.value;
  const { line, area } = pathOf(samples);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-8">
        <Tag
          appearance="accent"
          size="md"
          label={`Now ${formatCurrencyValue(last.value, currency)}`}
        />
        <Tag
          appearance={change < 0 ? "error" : "success"}
          size="md"
          label={`${change < 0 ? "" : "+"}${formatCurrencyValue(change, currency)}`}
        />
        <Tag
          appearance="gray"
          size="md"
          label={`Low ${formatCurrencyValue(Math.min(...values), currency)}`}
        />
        <Tag
          appearance="gray"
          size="md"
          label={`High ${formatCurrencyValue(Math.max(...values), currency)}`}
        />
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full text-base"
        style={{ height: HEIGHT }}
        preserveAspectRatio="none"
      >
        <title>Balance history</title>
        {samples.length > 1 ? (
          <>
            <path d={area} fill="currentColor" opacity={0.08} />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : (
          <circle cx={WIDTH / 2} cy={HEIGHT / 2} r={4} fill="currentColor" />
        )}
      </svg>
      <div className="flex justify-between body-3 text-muted">
        <span>{dateOf(first.time)}</span>
        <span>{samples.length} points</span>
        <span>{dateOf(last.time)}</span>
      </div>
    </div>
  );
}
