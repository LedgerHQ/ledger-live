/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TUSD({ size, color }: Props): JSX.Element;
declare namespace TUSD {
    var DefaultColor: string;
}
export default TUSD;
