/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function WINGS({ size, color }: Props): JSX.Element;
declare namespace WINGS {
    var DefaultColor: string;
}
export default WINGS;
