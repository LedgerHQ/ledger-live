/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SPANK({ size, color }: Props): JSX.Element;
declare namespace SPANK {
    var DefaultColor: string;
}
export default SPANK;
