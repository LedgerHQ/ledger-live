/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GZR({ size, color }: Props): JSX.Element;
declare namespace GZR {
    var DefaultColor: string;
}
export default GZR;
