import React, { useState } from "react";
import { Copy, Check, ExternalLink, Sparkles, Download, Layers } from "lucide-react";
import { LoomSymbol, LoomLogo, LoomAppIcon } from "../components/brand/loom-brand.js";
import { Button } from "../components/ui.js";

const colorTokens = [
  { name: "Obsidian Canvas", hex: "#09090B", role: "Primary base background", textDark: false },
  { name: "Card Surface", hex: "#111215", role: "Component containers & panels", textDark: false },
  { name: "Elevated Surface", hex: "#18191E", role: "Floating panels & modals", textDark: false },
  { name: "Cool Blue Accent", hex: "#889CFF", role: "Brand signature & focus state", textDark: true },
  { name: "Blue 3D Facet", hex: "#3E406D", role: "Chiseled shadow relief for accent", textDark: false },
  { name: "Pure Front L", hex: "#F4F5F7", role: "Geometric symbol face & display", textDark: true },
  { name: "White 3D Facet", hex: "#606264", role: "Chiseled shadow relief for L base", textDark: false },
  { name: "Proof Emerald", hex: "#34D399", role: "Verification & passing checks", textDark: true },
  { name: "Ember Risk", hex: "#F97316", role: "Contract break & high severity", textDark: true },
];

export function BrandShowcasePage() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex).catch(() => {});
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 8px 48px" }}>
      {/* Brand Hero */}
      <section
        style={{
          background: "linear-gradient(180deg, #121318 0%, #09090b 100%)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "56px 24px",
          textAlign: "center",
          marginBottom: 32,
          boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "inline-flex", marginBottom: 20 }}>
          <LoomLogo height={56} />
        </div>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--brand-blue)",
            marginBottom: 12,
          }}
        >
          Change-Impact Intelligence · Brand System
        </p>
        <p
          style={{
            maxWidth: 620,
            margin: "0 auto",
            color: "var(--text-2)",
            fontSize: 14.5,
            lineHeight: 1.6,
          }}
        >
          The canonical visual identity of Loom: architectural restraint, geometric precision, and an electric cool blue accent that balances conservative static analysis with high developer utility.
        </p>
      </section>

      {/* Grid: The Symbol Construction & Geometry */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 32 }}>
        {/* Symbol Geometry Card */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Sparkles size={18} style={{ color: "var(--brand-blue)" }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>The Geometric L Symbol</h3>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
            Constructed on a strict 7×7 modular grid with a 9px module unit. A solid white foundation forms the capital “L”, while a cool blue block rests nestled in the counter space.
          </p>

          <div
            style={{
              background: "#0c0d10",
              border: "1px solid #1f2026",
              borderRadius: 8,
              padding: 32,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 36,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <LoomSymbol size={96} />
              <span style={{ display: "block", marginTop: 10, fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>
                64px Active Grid
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <LoomAppIcon size={96} />
              <span style={{ display: "block", marginTop: 10, fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>
                Rounded App Icon
              </span>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-2)" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 4, border: "1px solid var(--line-soft)" }}>
              <strong>Stem width:</strong> 18px (2 units)
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 4, border: "1px solid var(--line-soft)" }}>
              <strong>Base height:</strong> 17px (2 units)
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 4, border: "1px solid var(--line-soft)" }}>
              <strong>Counter space:</strong> 8px (1 unit)
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 4, border: "1px solid var(--line-soft)" }}>
              <strong>3D Facet depth:</strong> 9px (1 unit)
            </div>
          </div>
        </section>

        {/* Scale Testing Card */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Layers size={18} style={{ color: "var(--brand-blue)" }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Silhouette Scale Verification</h3>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
            Tested across all primary developer viewports and display resolutions to ensure immediate legibility from micro favicons to macro display headers.
          </p>

          <div
            style={{
              background: "#0c0d10",
              border: "1px solid #1f2026",
              borderRadius: 8,
              padding: "24px 20px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "flex-end",
            }}
          >
            {[
              { size: 16, label: "16px Favicon" },
              { size: 24, label: "24px Nav" },
              { size: 32, label: "32px App" },
              { size: 48, label: "48px Card" },
              { size: 64, label: "64px Hero" },
            ].map(({ size, label }) => (
              <div key={size} style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <LoomSymbol size={size} />
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Surface Contrast Modes</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 6, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <LoomSymbol size={28} surface="dark" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#f4f4f5" }}>Dark Obsidian</div>
                  <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "#a1a1aa" }}>#09090B Canvas</div>
                </div>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <LoomSymbol size={28} surface="light" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#09090b" }}>Light Paper</div>
                  <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "#64748b" }}>#F8FAFC Canvas</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Color Tokens Matrix */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 600 }}>Color Architecture & Swatches</h3>
        <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 20 }}>
          Canonical color values defining the dark technical atmosphere and semantic signaling. Click any swatch to copy the hex code.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {colorTokens.map((token) => (
            <button
              key={token.hex}
              type="button"
              onClick={() => copyToClipboard(token.hex)}
              style={{
                background: "#0c0d10",
                border: "1px solid #1e1f24",
                borderRadius: 8,
                padding: 12,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  height: 36,
                  borderRadius: 5,
                  background: token.hex,
                  marginBottom: 10,
                  border: token.hex === "#09090B" || token.hex === "#111215" ? "1px solid #27272a" : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 8,
                }}
              >
                {copiedHex === token.hex ? (
                  <Check size={14} style={{ color: token.textDark ? "#09090b" : "#ffffff" }} />
                ) : (
                  <Copy size={12} style={{ color: token.textDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)" }} />
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)" }}>{token.name}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--brand-blue)" }}>{token.hex}</div>
              <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>{token.role}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Asset Files Information */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: 24,
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 600 }}>Canonical Asset Inventory</h3>
        <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 16 }}>
          All production vectors are maintained in <code>brand/</code> as the canonical single source of truth.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {[
            { file: "brand/symbol-l-dark.svg", desc: "Dark surface geometric L symbol (64×64)" },
            { file: "brand/symbol-l-light.svg", desc: "Light surface geometric L symbol (64×64)" },
            { file: "brand/symbol-app-icon.svg", desc: "Rounded app icon with 14px radius (64×64)" },
            { file: "brand/favicon.svg", desc: "Optimized 32×32 SVG favicon for browsers" },
            { file: "brand/logo-horizontal-dark.svg", desc: "Horizontal logo with wordmark (dark)" },
            { file: "brand/tokens.json", desc: "Structured design tokens in W3C format" },
          ].map((item) => (
            <div
              key={item.file}
              style={{
                background: "#0c0d10",
                border: "1px solid var(--line-soft)",
                borderRadius: 6,
                padding: "12px 14px",
              }}
            >
              <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--brand-blue)", fontWeight: 600 }}>
                {item.file}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
