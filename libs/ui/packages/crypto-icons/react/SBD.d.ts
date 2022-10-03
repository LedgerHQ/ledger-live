/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SBD({ size, color }: Props): JSX.Element;
declare namespace SBD {
    var DefaultColor: string;
}
export default SBD;
