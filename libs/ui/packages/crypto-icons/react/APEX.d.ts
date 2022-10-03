/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function APEX({ size, color }: Props): JSX.Element;
declare namespace APEX {
    var DefaultColor: string;
}
export default APEX;
