/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MANA({ size, color }: Props): JSX.Element;
declare namespace MANA {
    var DefaultColor: string;
}
export default MANA;
