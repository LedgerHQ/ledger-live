/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ACT({ size, color }: Props): JSX.Element;
declare namespace ACT {
    var DefaultColor: string;
}
export default ACT;
