/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GABI({ size, color }: Props): JSX.Element;
declare namespace GABI {
    var DefaultColor: string;
}
export default GABI;
