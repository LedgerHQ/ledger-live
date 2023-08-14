import { ff } from "./../helpers";
export default (props: { ff?: string }) => {
  const prop = props.ff;
  if (!prop) {
    return null;
  }
  return ff(prop);
};
