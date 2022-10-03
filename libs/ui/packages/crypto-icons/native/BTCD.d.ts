/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BTCD({ size, color }: Props): JSX.Element;
declare namespace BTCD {
    var DefaultColor: string;
}
export default BTCD;
