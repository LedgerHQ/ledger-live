/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ENTRP({ size, color }: Props): JSX.Element;
declare namespace ENTRP {
    var DefaultColor: string;
}
export default ENTRP;
