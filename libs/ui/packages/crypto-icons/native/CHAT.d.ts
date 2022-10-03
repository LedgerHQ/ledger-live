/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CHAT({ size, color }: Props): JSX.Element;
declare namespace CHAT {
    var DefaultColor: string;
}
export default CHAT;
