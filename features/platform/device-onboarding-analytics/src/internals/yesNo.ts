export type YesNo = "yes" | "no";

export const yesNo = (value: boolean): YesNo => (value ? "yes" : "no");
