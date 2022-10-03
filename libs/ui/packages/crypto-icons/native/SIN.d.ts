/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SIN({ size, color }: Props): JSX.Element;
declare namespace SIN {
    var DefaultColor: string;
}
export default SIN;
