/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EXMO({ size, color }: Props): JSX.Element;
declare namespace EXMO {
    var DefaultColor: string;
}
export default EXMO;
