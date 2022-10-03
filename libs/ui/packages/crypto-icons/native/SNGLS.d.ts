/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SNGLS({ size, color }: Props): JSX.Element;
declare namespace SNGLS {
    var DefaultColor: string;
}
export default SNGLS;
