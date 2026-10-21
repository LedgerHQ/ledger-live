import { http, HttpResponse, passthrough, delay } from "msw";

type Mode = "pass" | "hang" | "error";

const MODES = new Set<string>(["pass", "hang", "error"]);

const toMode = (value: string | undefined): Mode =>
  value && MODES.has(value) ? (value as Mode) : "pass";

// Read at bundle time: babel-plugin-transform-inline-environment-variables inlines them.
const CURRENCIES_MODE = toMode(process.env.MSW_CAL_CURRENCIES);
const TOKENS_MODE = toMode(process.env.MSW_CAL_TOKENS);

const answer = async (mode: Mode) => {
  if (mode === "hang") {
    await delay("infinite");
  }
  if (mode === "error") {
    return HttpResponse.json({ message: "CAL down (mock)" }, { status: 503 });
  }
  return passthrough();
};

const handlers = [
  http.get("*/cal/v1/currencies", () => answer(CURRENCIES_MODE)),
  http.get("*/cal/v1/tokens", () => answer(TOKENS_MODE)),
];

export default handlers;
