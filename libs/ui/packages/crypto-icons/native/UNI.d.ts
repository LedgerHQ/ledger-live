/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function UNI({ size, color }: Props): JSX.Element;
declare namespace UNI {
    var DefaultColor: string;
}
export default UNI;
