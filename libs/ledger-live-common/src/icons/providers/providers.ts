import { CDN_URL } from "../consts/urls";

type GetProviderIconUrlProps = {
  cdn?: string;
  name: string;
  boxed: boolean;
};

export const getProviderIconUrl = ({ cdn = CDN_URL, name, boxed }: GetProviderIconUrlProps) => {
  const iconType = boxed ? "boxed" : "default";
  return `${cdn}/icons/providers/${iconType}/${name.toLowerCase()}.svg`;
};
