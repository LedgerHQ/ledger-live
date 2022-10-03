/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XMR({ size, color }: Props): JSX.Element;
declare namespace XMR {
    var DefaultColor: string;
}
export default XMR;
