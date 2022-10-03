/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function IQ({ size, color }: Props): JSX.Element;
declare namespace IQ {
    var DefaultColor: string;
}
export default IQ;
