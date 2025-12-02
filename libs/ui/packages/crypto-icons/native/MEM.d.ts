/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function MEM({ size, color }: Props): JSX.Element;
declare namespace MEM {
    var DefaultColor: string;
}
export default MEM;
