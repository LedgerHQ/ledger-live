/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XBY({ size, color }: Props): JSX.Element;
declare namespace XBY {
    var DefaultColor: string;
}
export default XBY;
