# @shared/trend

> [!NOTE]
> **Status: STABLE**. Production-ready; API is considered stable.

Tone, sign and percent text of a value change. Pure functions with no dependency, used by web and native screens that show a variation (portfolio trend, market change, chart color).

Each function only answers one question. Callers keep their own placeholder, discreet mode and color mapping.

## API

| Export | Returns |
| --- | --- |
| `getTrendTone(value, { decimals? })` | `"positive" \| "negative" \| "neutral"`. `null`, `undefined`, `NaN` and `0` are `"neutral"`. With `decimals`, the value is rounded before the comparison, so `0.004` with `decimals: 2` is `"neutral"`. |
| `getTrendSign(value, { decimals?, zeroSign? })` | `"+"`, `"-"`, or `zeroSign` (default `""`) for zero. |
| `formatTrendPercent(percent, { decimals?, zeroSign? })` | Sign, absolute value and `%`: `"+3.50%"`, `"-1.20%"`, `"0.00%"`. `decimals` defaults to `2`; `null` keeps the raw digits. |

Values are in the unit the screen shows. A ratio (`0.035`) is multiplied by 100 before `formatTrendPercent`.

## Usage

```ts
import { formatTrendPercent, getTrendTone } from "@shared/trend";

const tone = getTrendTone(percentage);
const text = formatTrendPercent(percentage * 100);
```

Web, with Tailwind:

```ts
const TONE_CLASS = { positive: "text-success", negative: "text-error", neutral: "text-muted" } as const;
```

Native, with Lumen:

```ts
const TONE_COLOR = { positive: "success", negative: "error", neutral: "muted" } as const;
```
