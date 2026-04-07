import type { FundReport } from "./types";

function formatAmount(raw: string, decimals: number, ticker: string): string {
  const value = BigInt(raw);
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = (value % divisor)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "")
    .slice(0, 6);
  return fraction ? `${whole}.${fraction} ${ticker}` : `${whole} ${ticker}`;
}

export function buildSlackPayload(report: FundReport): Record<string, unknown> {
  const low = report.accounts.filter(a => a.isLow);
  const errored = report.accounts.filter(a => a.error);
  const ok = report.accounts.length - low.length - errored.length;

  const header = report.hasAlerts
    ? "⚠️ E2E Fund Monitor — Action Required"
    : "✅ E2E Fund Monitor — All Wallets Healthy";

  const summary = [
    `Checked *${report.accounts.length}* account(s) on ${new Date(report.date).toUTCString()}`,
    `*${low.length}* below threshold  •  *${ok}* OK  •  *${errored.length}* error(s)`,
  ].join("\n");

  const alertLines = report.accounts
    .filter(a => a.isLow || a.error)
    .map(a => {
      const lines = [
        `*${a.name}* — Balance: \`${formatAmount(a.balance, a.decimals, a.ticker)}\` | Min: \`${formatAmount(a.threshold, a.decimals, a.ticker)}\``,
      ];
      if (a.freshAddress) lines.push(`Top-up: \`${a.freshAddress}\``);
      if (a.error) lines.push(`Error: \`${a.error.slice(0, 120)}\``);
      return lines.join("\n");
    });

  const body = [summary, ...alertLines].join("\n\n");

  return {
    text: header,
    blocks: [
      { type: "header", text: { type: "plain_text", text: header, emoji: true } },
      { type: "section", text: { type: "mrkdwn", text: body } },
    ],
  };
}
