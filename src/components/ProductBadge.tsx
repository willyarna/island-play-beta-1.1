export function ProductBadge({ name, color, imageUrl }: { name: string; color: string; imageUrl?: string | null }) {
  const hasImage = Boolean(imageUrl);

  return (
    <span
      className={`product-badge mr-3 inline-grid h-10 w-10 place-items-center overflow-hidden rounded-full align-middle font-extrabold ${hasImage ? "product-badge-image" : ""}`}
      style={hasImage ? undefined : { background: color }}
    >
      {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-contain" /> : name.slice(0, 1)}
    </span>
  );
}
