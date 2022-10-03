/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AST({ size, color }: Props): JSX.Element;
declare namespace AST {
    var DefaultColor: string;
}
export default AST;
