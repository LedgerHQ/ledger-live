/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function COQUI({ size, color }: Props): JSX.Element;
declare namespace COQUI {
    var DefaultColor: string;
}
export default COQUI;
