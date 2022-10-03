/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ELEC({ size, color }: Props): JSX.Element;
declare namespace ELEC {
    var DefaultColor: string;
}
export default ELEC;
