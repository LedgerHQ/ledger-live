/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function OMNI({ size, color }: Props): JSX.Element;
declare namespace OMNI {
    var DefaultColor: string;
}
export default OMNI;
