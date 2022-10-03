/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PIRL({ size, color }: Props): JSX.Element;
declare namespace PIRL {
    var DefaultColor: string;
}
export default PIRL;
