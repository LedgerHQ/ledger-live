/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XBC({ size, color }: Props): JSX.Element;
declare namespace XBC {
    var DefaultColor: string;
}
export default XBC;
