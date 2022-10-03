/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function HBAR({ size, color }: Props): JSX.Element;
declare namespace HBAR {
    var DefaultColor: string;
}
export default HBAR;
