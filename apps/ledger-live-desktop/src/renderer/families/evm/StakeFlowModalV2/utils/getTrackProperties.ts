type Props = {
  value: string | boolean;
  modal?: string;
};

export function getTrackProperties({ value, modal = "stake" }: Props) {
  return {
    path: window.location.hash
      .split("/")
      .filter(e => e !== "#")
      .join("/"),
    modal,
    flow: "stake",
    value,
  };
}
