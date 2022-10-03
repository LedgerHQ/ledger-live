/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AION({ size, color }: Props): JSX.Element;
declare namespace AION {
    var DefaultColor: string;
}
export default AION;
