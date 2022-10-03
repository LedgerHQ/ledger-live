/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SAN({ size, color }: Props): JSX.Element;
declare namespace SAN {
    var DefaultColor: string;
}
export default SAN;
