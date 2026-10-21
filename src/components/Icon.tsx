export function Icon({ name, className = '', style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return <span className={`material-icons ${className}`.trim()} style={style}>{name}</span>;
}
