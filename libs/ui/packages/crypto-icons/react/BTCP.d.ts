/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BTCP({ size, color }: Props): JSX.Element;
declare namespace BTCP {
    var DefaultColor: string;
}
export default BTCP;
