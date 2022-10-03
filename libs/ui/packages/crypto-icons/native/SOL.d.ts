/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SOL({ size, color }: Props): JSX.Element;
declare namespace SOL {
    var DefaultColor: string;
}
export default SOL;
