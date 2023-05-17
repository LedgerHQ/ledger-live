type Props = {
  value: string;
  locationHash: string;
  source: string;
};

export function getTrackProperties({ value, locationHash, source }: Props) {
  return {
    page: locationHash
      .split("/")
      .filter(e => e !== "#")
      .join("/"),
    modal: source,
    flow: "stake",
    value,
  };
}
