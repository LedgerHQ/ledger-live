/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function CSPR({ size, color }: Props): JSX.Element;
declare namespace CSPR {
    var DefaultColor: string;
}
export default CSPR;
