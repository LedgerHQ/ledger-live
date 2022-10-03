/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DOT({ size, color }: Props): JSX.Element;
declare namespace DOT {
    var DefaultColor: string;
}
export default DOT;
