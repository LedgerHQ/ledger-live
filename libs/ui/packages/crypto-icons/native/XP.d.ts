/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XP({ size, color }: Props): JSX.Element;
declare namespace XP {
    var DefaultColor: string;
}
export default XP;
