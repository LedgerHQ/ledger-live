export const mmddyyyyFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export const ddmmyyyyFormatter = new Intl.DateTimeFormat("fr-FR", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export const genericFormatter = (language: string) =>
  new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

export enum Format {
  default = "default",
  ddmmyyyy = "DD/MM/YYYY",
  mmddyyyy = "MM/DD/YYYY",
}
