/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XBP({ size, color }: Props): JSX.Element;
declare namespace XBP {
    var DefaultColor: string;
}
export default XBP;
