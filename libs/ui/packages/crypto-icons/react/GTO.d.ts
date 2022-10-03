/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GTO({ size, color }: Props): JSX.Element;
declare namespace GTO {
    var DefaultColor: string;
}
export default GTO;
