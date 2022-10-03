/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function LPT({ size, color }: Props): JSX.Element;
declare namespace LPT {
    var DefaultColor: string;
}
export default LPT;
