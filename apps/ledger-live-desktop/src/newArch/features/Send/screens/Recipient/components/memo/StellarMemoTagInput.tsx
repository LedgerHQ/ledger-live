import { CommonMemoTagComponentProps, registerComponentForNetwork } from "./MemoTagFactory";

type StellarMemoTagProps = CommonMemoTagComponentProps;

function StellarMemoTag({ _onChange }: StellarMemoTagProps) {
  return null;
}

registerComponentForNetwork("stellar", StellarMemoTag);
