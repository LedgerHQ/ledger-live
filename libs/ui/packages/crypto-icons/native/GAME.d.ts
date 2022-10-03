/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GAME({ size, color }: Props): JSX.Element;
declare namespace GAME {
    var DefaultColor: string;
}
export default GAME;
