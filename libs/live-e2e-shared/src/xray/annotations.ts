import type { XrayParameter } from "./report";

/**
 * Annotation carrying the data-driven Xray test a case is an iteration of.
 *
 * allure-playwright renders any annotation it does not recognise as a step titled
 * `"<TYPE>: <description>"`, so the description is human-facing — hence the readable
 * `B2CQA-4500 [Currency=BTC]` form rather than a JSON blob.
 */
export const TMS_DATASET = "TMS_DATASET";

const TMS = "TMS";
const DESCRIPTION_PATTERN = /^(\S+)\s+\[(.+)]$/;

export type XrayDataset = { testKey: string; parameters: XrayParameter[] };

type Annotation = { type: string; description?: string };

/**
 * Reports the test as one *iteration* of `testKey` rather than a plain pass/fail on it.
 * `parameters` must match the dataset columns configured on that Xray test, so one red row
 * shows red while the others stay green. See QAA-1451.
 *
 * ```ts
 * annotation: [
 *   { type: "TMS", description: "B2CQA-2644, B2CQA-2672" },
 *   xrayDataset("B2CQA-4500", { Currency: currency.testLabel }),
 * ]
 * ```
 */
export function xrayDataset(testKey: string, parameters: Record<string, string>): Annotation {
  const rendered = Object.entries(parameters)
    .map(([name, value]) => `${name}=${value}`)
    .join(", ");
  return { type: TMS_DATASET, description: `${testKey} [${rendered}]` };
}

function parseDataset(description: string | undefined): XrayDataset | null {
  const match = DESCRIPTION_PATTERN.exec(description ?? "");
  if (!match) {
    console.error(`[xray] ignoring malformed ${TMS_DATASET} annotation: ${description}`);
    return null;
  }
  const [, testKey, rendered] = match;
  const parameters = rendered.split(", ").map(pair => {
    const separator = pair.indexOf("=");
    return { name: pair.slice(0, separator), value: pair.slice(separator + 1) };
  });
  // Xray rejects an iteration with no parameters, so a dataset without one has nowhere to go.
  if (parameters.some(parameter => !parameter.name || !parameter.value)) {
    console.error(`[xray] ignoring ${TMS_DATASET} annotation with empty parameter: ${description}`);
    return null;
  }
  return { testKey, parameters };
}

function splitKeys(description: string | undefined): string[] {
  return (description ?? "")
    .split(",")
    .map(key => key.trim())
    .filter(Boolean);
}

/**
 * The plain Xray keys and the dataset iterations declared on a test. A key declared as both is
 * kept only as an iteration, so it cannot appear twice in the payload.
 */
export function parseXrayAnnotations(annotations: readonly Annotation[]): {
  plainKeys: string[];
  datasets: XrayDataset[];
} {
  const plainKeys: string[] = [];
  const datasets: XrayDataset[] = [];

  for (const annotation of annotations) {
    if (annotation.type === TMS) {
      plainKeys.push(...splitKeys(annotation.description));
    } else if (annotation.type === TMS_DATASET) {
      const dataset = parseDataset(annotation.description);
      if (dataset) datasets.push(dataset);
    }
  }

  const datasetKeys = new Set(datasets.map(dataset => dataset.testKey));
  const deduped = plainKeys.filter(key => {
    if (!datasetKeys.has(key)) return true;
    console.error(`[xray] ${key} is declared as both a plain TMS key and a dataset iteration`);
    return false;
  });

  return { plainKeys: [...new Set(deduped)], datasets };
}

/** Every Jira key on a test — plain and dataset alike — for Allure links. */
export function xrayKeys(annotations: readonly Annotation[]): string[] {
  const { plainKeys, datasets } = parseXrayAnnotations(annotations);
  return [...new Set([...plainKeys, ...datasets.map(dataset => dataset.testKey)])];
}
