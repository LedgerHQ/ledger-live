/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AMPL({ size, color }: Props): JSX.Element;
declare namespace AMPL {
    var DefaultColor: string;
}
export default AMPL;
