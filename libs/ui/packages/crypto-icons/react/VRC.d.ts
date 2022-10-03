/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VRC({ size, color }: Props): JSX.Element;
declare namespace VRC {
    var DefaultColor: string;
}
export default VRC;
