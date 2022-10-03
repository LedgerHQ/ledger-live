/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ACTN({ size, color }: Props): JSX.Element;
declare namespace ACTN {
    var DefaultColor: string;
}
export default ACTN;
