/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function APPC({ size, color }: Props): JSX.Element;
declare namespace APPC {
    var DefaultColor: string;
}
export default APPC;
