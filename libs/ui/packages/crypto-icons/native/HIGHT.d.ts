/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function HIGHT({ size, color }: Props): JSX.Element;
declare namespace HIGHT {
    var DefaultColor: string;
}
export default HIGHT;
