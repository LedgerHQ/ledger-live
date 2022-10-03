/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XEM({ size, color }: Props): JSX.Element;
declare namespace XEM {
    var DefaultColor: string;
}
export default XEM;
