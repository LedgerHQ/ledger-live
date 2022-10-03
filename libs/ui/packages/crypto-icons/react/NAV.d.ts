/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NAV({ size, color }: Props): JSX.Element;
declare namespace NAV {
    var DefaultColor: string;
}
export default NAV;
