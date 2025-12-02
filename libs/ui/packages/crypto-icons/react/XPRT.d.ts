/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function XPRT({ size, color }: Props): JSX.Element;
declare namespace XPRT {
    var DefaultColor: string;
}
export default XPRT;
