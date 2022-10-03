/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EBST({ size, color }: Props): JSX.Element;
declare namespace EBST {
    var DefaultColor: string;
}
export default EBST;
