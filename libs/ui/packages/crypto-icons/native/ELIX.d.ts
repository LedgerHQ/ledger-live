/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ELIX({ size, color }: Props): JSX.Element;
declare namespace ELIX {
    var DefaultColor: string;
}
export default ELIX;
