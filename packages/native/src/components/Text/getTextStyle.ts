export type TextTypes =
  | "h1"
  | "h2"
  | "h3"
  | "highlight"
  | "emphasis"
  | "body"
  | "link"
  | "tiny"
  | "subTitle"
  | "navigation"
  | "tag"
  | "large"
  | "paragraph";

export type FontWeightTypes = "medium" | "semibold" | "bold";

export function getTextStyle({
  type,
  bracket,
}: {
  type?: TextTypes;
  bracket?: boolean;
}): {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight?: number;
  textDecoration?: string;
  paddingTop?: number;
} {
  switch (type) {
    case "h1":
      return {
        fontFamily: "Alpha",
        fontSize: 36,
        lineHeight: 43.2,
        paddingTop: bracket ? 15 : 0,
      };
    case "h2":
      return {
        fontFamily: "Alpha",
        fontSize: 28,
        lineHeight: 33.6,
        paddingTop: bracket ? 10 : 0,
      };
    case "h3":
      return {
        fontFamily: "Alpha",
        fontSize: 20,
        lineHeight: 24,
        paddingTop: bracket ? 5 : 0,
      };
    case "large":
    case "highlight":
      return {
        fontFamily: "Inter",
        fontSize: 16,
        lineHeight: 19.36,
      };
    case "emphasis":
      return {
        fontFamily: "Inter",
        fontSize: 14,
        lineHeight: 20,
      };
    case "body":
      return {
        fontFamily: "Inter",
        fontSize: 14,
        lineHeight: 20,
      };
    case "paragraph":
      return {
        fontFamily: "Inter",
        fontSize: 13,
        lineHeight: 15.73,
        fontWeight: 600,
      };
    case "link":
      return {
        fontFamily: "Inter",
        fontSize: 13,
        lineHeight: 16,
        textDecoration: "underline",
      };
    case "tiny":
      return {
        fontFamily: "Inter",
        fontSize: 12,
        lineHeight: 16,
      };
    case "navigation":
      return {
        fontFamily: "Inter",
        fontSize: 12,
        lineHeight: 14.52,
        fontWeight: 600,
      };
    case "subTitle":
      return {
        fontFamily: "Inter",
        fontSize: 11,
        lineHeight: 13.31,
        fontWeight: 600,
      };
    case "tag":
      return {
        fontFamily: "Inter",
        fontSize: 10,
        lineHeight: 12.1,
        fontWeight: 600,
      };
    default:
      return {
        fontFamily: "Inter",
        fontSize: 13,
        lineHeight: 20,
      };
  }
}

export function getFontWeightStyle({
  fontWeight,
}: {
  fontWeight?: FontWeightTypes;
}): {
  fontWeight: number;
} {
  switch (fontWeight) {
    case "semibold":
      return {
        fontWeight: 600,
      };
    case "bold":
      return {
        fontWeight: 700,
      };
    case "medium":
    default:
      return {
        fontWeight: 500,
      };
  }
}
