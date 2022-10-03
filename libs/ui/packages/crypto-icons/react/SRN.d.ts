/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SRN({ size, color }: Props): JSX.Element;
declare namespace SRN {
    var DefaultColor: string;
}
export default SRN;
