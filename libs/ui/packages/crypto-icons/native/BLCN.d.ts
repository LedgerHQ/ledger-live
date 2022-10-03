/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BLCN({ size, color }: Props): JSX.Element;
declare namespace BLCN {
    var DefaultColor: string;
}
export default BLCN;
