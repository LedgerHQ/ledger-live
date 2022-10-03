/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XRP({ size, color }: Props): JSX.Element;
declare namespace XRP {
    var DefaultColor: string;
}
export default XRP;
