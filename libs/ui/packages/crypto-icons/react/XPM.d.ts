/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XPM({ size, color }: Props): JSX.Element;
declare namespace XPM {
    var DefaultColor: string;
}
export default XPM;
