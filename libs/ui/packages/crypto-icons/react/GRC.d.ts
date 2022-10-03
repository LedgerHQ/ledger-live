/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GRC({ size, color }: Props): JSX.Element;
declare namespace GRC {
    var DefaultColor: string;
}
export default GRC;
