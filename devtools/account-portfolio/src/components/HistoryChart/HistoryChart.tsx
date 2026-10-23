import { formatCurrencyValue } from "../../utils/format";
import { historyChartScale, type HistoryChartPoint } from "../../utils/historySeries";

const WIDTH = 640;
const HEIGHT = 160;
const GRID_LINES = 3;

const formatDate = (time: number) =>
  new Date(time).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Worth of the account over the range: time runs left to right, worth bottom to top. */
export function HistoryChart({
  points,
  currency,
}: Readonly<{ points: readonly HistoryChartPoint[]; currency: string }>) {
  if (points.length === 0) {
    return (
      <div className="py-8 body-3 text-muted">
        No graph: the service gave no value in {currency.toUpperCase()} for these points.
      </div>
    );
  }
  const times = points.map(point => point.time);
  const values = points.map(point => point.fiat);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeSpan = maxTime - minTime || 1;
  const { minValue, valueSpan, labels } = historyChartScale(values, GRID_LINES);
  const line = points
    .map(point => {
      const x = ((point.time - minTime) / timeSpan) * WIDTH;
      const y = HEIGHT - ((point.fiat - minValue) / valueSpan) * HEIGHT;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const yLabels = labels.map(value => ({
    value,
    label: formatCurrencyValue(value, currency),
  }));
  const xLabels = [minTime, minTime + timeSpan / 2, maxTime];

  return (
    <div className="flex flex-col gap-4">
      <div className="body-3 text-muted">
        Total worth of the account, in {currency.toUpperCase()}, over time
      </div>
      <div className="flex gap-8">
        <div className="flex h-160 shrink-0 flex-col justify-between body-3 text-muted">
          {yLabels.map(({ value, label }) => (
            <span key={value}>{label}</span>
          ))}
        </div>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="h-160 min-w-0 flex-1 text-accent"
        >
          <title>Balance history</title>
          {yLabels.map(({ value }, index) => {
            const y = (HEIGHT * index) / (GRID_LINES - 1);
            return (
              <line
                key={value}
                x1={0}
                x2={WIDTH}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.2}
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          <polyline
            points={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="flex justify-between body-3 text-muted">
        {xLabels.map(time => (
          <span key={time}>{formatDate(time)}</span>
        ))}
      </div>
    </div>
  );
}
