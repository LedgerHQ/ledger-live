export type FooterVariant = "content-card" | "default";

export type Props = {
  slides: {
    id: number | string;
    Component: () => React.JSX.Element;
  }[];
  footerVariant?: FooterVariant;
};
