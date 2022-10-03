/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XPA({ size, color }: Props): JSX.Element;
declare namespace XPA {
    var DefaultColor: string;
}
export default XPA;
