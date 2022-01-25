import { ff } from "../helpers";

export default (props: { ff?: string }) => {
  const prop = props.ff;

  if (prop == null) {
    return null;
  }

  return ff(prop);
};
