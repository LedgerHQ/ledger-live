/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function CTXC({ size, color }: Props): JSX.Element;
declare namespace CTXC {
    var DefaultColor: string;
}
export default CTXC;
