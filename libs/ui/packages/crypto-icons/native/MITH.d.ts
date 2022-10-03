/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MITH({ size, color }: Props): JSX.Element;
declare namespace MITH {
    var DefaultColor: string;
}
export default MITH;
