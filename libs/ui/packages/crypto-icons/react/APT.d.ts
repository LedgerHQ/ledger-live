/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function APT({ size, color }: Props): JSX.Element;
declare namespace APT {
    var DefaultColor: string;
}
export default APT;
