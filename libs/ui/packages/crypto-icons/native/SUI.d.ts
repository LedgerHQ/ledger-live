/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function SUI({ size, color }: Props): JSX.Element;
declare namespace SUI {
    var DefaultColor: string;
}
export default SUI;
