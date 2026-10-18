import React from "react";

export interface LoomSymbolProps {
  size?: number | string;
  className?: string;
  surface?: "dark" | "light";
  title?: string;
}

/**
 * Canonical Loom Geometric L Symbol with Cool Blue Accent
 * Modular 7x7 geometry with chiseled facets matching the Figma Make project.
 */
export function LoomSymbol({
  size = 24,
  className,
  surface = "dark",
  title = "Loom",
}: LoomSymbolProps) {
  const isLight = surface === "light";
  const whiteL = isLight ? "#09090B" : "#F4F5F7";
  const whiteFacet = isLight ? "#71717A" : "#606264";
  const blueAccent = isLight ? "#4F46E5" : "#889CFF";
  const blueFacet = isLight ? "#312E81" : "#3E406D";

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {/* Front Face of the L */}
      <path d="M0 1H18V46H53V63H0V1Z" fill={whiteL} />
      {/* 3D Facet of the L */}
      <path d="M53 46H62V63H53V46Z" fill={whiteFacet} />
      {/* Cool Blue Accent Front Face */}
      <path d="M26 1H53V19H44V37H26V1Z" fill={blueAccent} />
      {/* Cool Blue Accent 3D Facet */}
      <path d="M53 1H62V19H53V1Z" fill={blueFacet} />
    </svg>
  );
}

export interface LoomAppIconProps {
  size?: number | string;
  className?: string;
}

/**
 * Canonical Loom App Icon (Container + Geometric Symbol)
 */
export function LoomAppIcon({ size = 32, className }: LoomAppIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="#09090B" stroke="#27272A" strokeWidth="1.5" />
      <g transform="translate(10, 10) scale(0.6875)">
        <path d="M0 1H18V46H53V63H0V1Z" fill="#F4F5F7" />
        <path d="M53 46H62V63H53V46Z" fill="#606264" />
        <path d="M26 1H53V19H44V37H26V1Z" fill="#889CFF" />
        <path d="M53 1H62V19H53V1Z" fill="#3E406D" />
      </g>
    </svg>
  );
}

export interface LoomLogoProps {
  height?: number;
  className?: string;
  surface?: "dark" | "light";
}

/**
 * Canonical Horizontal Loom Logo with Wordmark
 */
export function LoomLogo({
  height = 28,
  className,
  surface = "dark",
}: LoomLogoProps) {
  const isLight = surface === "light";
  const textColor = isLight ? "#09090B" : "#F4F5F7";

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: `${Math.round(height * 0.35)}px`,
        lineHeight: 1,
      }}
    >
      <LoomSymbol size={height} surface={surface} title="" />
      <span
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: `${Math.round(height * 0.78)}px`,
          fontWeight: 700,
          letterSpacing: "-0.035em",
          color: textColor,
          userSelect: "none",
        }}
      >
        Loom
      </span>
    </div>
  );
}
