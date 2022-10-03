/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SLR({ size, color }: Props): JSX.Element;
declare namespace SLR {
    var DefaultColor: string;
}
export default SLR;
