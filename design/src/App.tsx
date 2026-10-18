import React, { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  Terminal,
  Grid,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { LoomSymbol, LoomLogo, LoomAppIcon } from "./components/brand/loom-brand.js";

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

export function App() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex).catch(() => {});
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", color: "var(--text)" }}>
      {/* Top Header */}
      <header
        style={{
          borderBottom: "1px solid var(--line-soft)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "rgba(9, 9, 11, 0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LoomLogo height={26} />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--text-3)",
              background: "#16171c",
              border: "1px solid #27272a",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            Brand Spec v1.0
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a
            href="#symbol"
            style={{ color: "var(--text-2)", fontSize: 13, textDecoration: "none" }}
          >
            The Symbol
          </a>
          <a
            href="#grid"
            style={{ color: "var(--text-2)", fontSize: 13, textDecoration: "none" }}
          >
            Geometry
          </a>
          <a
            href="#colors"
            style={{ color: "var(--text-2)", fontSize: 13, textDecoration: "none" }}
          >
            Colors
          </a>
          <a
            href="#scales"
            style={{ color: "var(--text-2)", fontSize: 13, textDecoration: "none" }}
          >
            Scale Matrix
          </a>
          <a
            href="http://localhost:4175/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--brand-blue)",
              color: "#07111d",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <span>Launch Cockpit</span>
            <ArrowRight size={14} />
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Hero Section */}
        <section
          style={{
            background: "linear-gradient(180deg, #13141a 0%, #09090b 100%)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "80px 24px",
            textAlign: "center",
            marginBottom: 48,
            boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "inline-flex", marginBottom: 24 }}>
            <LoomLogo height={72} />
          </div>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--brand-blue)",
              marginBottom: 16,
            }}
          >
            Change-Impact Intelligence · Brand System
          </p>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: "0 auto 16px",
              maxWidth: 720,
              color: "#ffffff",
            }}
          >
            Architectural precision for static analysis and contract verification
          </h1>
          <p
            style={{
              maxWidth: 640,
              margin: "0 auto 28px",
              color: "var(--text-2)",
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            Derived faithfully from the Figma Make project: an uncompromising dark atmosphere, chiseled relief facets, and an electric cool blue accent that balances conservative compiler rigor with high developer utility.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
            <a
              href="http://localhost:4175/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--brand-blue)",
                color: "#07111d",
                padding: "10px 20px",
                borderRadius: 7,
                fontSize: 13.5,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span>Open Developer Cockpit</span>
              <ArrowRight size={16} />
            </a>
            <a
              href="#symbol"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--line)",
                padding: "10px 18px",
                borderRadius: 7,
                fontSize: 13.5,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <span>Explore Identity Spec</span>
            </a>
          </div>
        </section>

        {/* Section 1: The Symbol */}
        <section id="symbol" style={{ marginBottom: 48 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: 28,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Sparkles size={18} style={{ color: "var(--brand-blue)" }} />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>The Geometric L Symbol</h2>
              </div>
              <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>
                The Loom mark is a bold, chiseled monogram formed by two interlocking structural elements:
              </p>
              <ul style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.7, paddingLeft: 20, margin: "0 0 20px" }}>
                <li>
                  <strong style={{ color: "#ffffff" }}>The Foundation:</strong> A solid off-white capital “L” ground plate with an 18px stem and 17px base.
                </li>
                <li>
                  <strong style={{ color: "var(--brand-blue)" }}>The Cool Blue Block:</strong> An electric iris accent (#889CFF) positioned nestled in the inner counter space.
                </li>
                <li>
                  <strong style={{ color: "var(--text-3)" }}>Chiseled Relieving Facets:</strong> 9px dark facets on the right side of both the blue accent and the white base, giving subtle depth and architectural weight.
                </li>
              </ul>

              <div style={{ display: "flex", gap: 20, justifyContent: "center", background: "#09090b", padding: 24, borderRadius: 8, border: "1px solid #1f2026" }}>
                <div style={{ textAlign: "center" }}>
                  <LoomSymbol size={80} />
                  <span style={{ display: "block", marginTop: 8, fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-3)" }}>
                    LoomSymbol (Dark)
                  </span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <LoomAppIcon size={80} />
                  <span style={{ display: "block", marginTop: 8, fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-3)" }}>
                    LoomAppIcon (64px)
                  </span>
                </div>
              </div>
            </div>

            {/* Geometry & Grid */}
            <div
              id="grid"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: 28,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Grid size={18} style={{ color: "var(--brand-blue)" }} />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>7×7 Modular Grid System</h2>
              </div>
              <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>
                Every coordinate, proportion, and spacing ratio aligns strictly to a 7×7 module with 9px unit increments:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12, fontFamily: "var(--mono)", color: "var(--text-2)", marginBottom: 24 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 6, border: "1px solid var(--line-soft)" }}>
                  <span style={{ color: "var(--brand-blue)" }}>Stem:</span> 18px (2 units)
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 6, border: "1px solid var(--line-soft)" }}>
                  <span style={{ color: "var(--brand-blue)" }}>Base:</span> 17px (2 units)
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 6, border: "1px solid var(--line-soft)" }}>
                  <span style={{ color: "var(--brand-blue)" }}>Counter:</span> 8px (1 unit)
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 6, border: "1px solid var(--line-soft)" }}>
                  <span style={{ color: "var(--brand-blue)" }}>Accent:</span> 27×36px (3×4 units)
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 6, border: "1px solid var(--line-soft)" }}>
                  <span style={{ color: "var(--brand-blue)" }}>Facet:</span> 9px (1 unit)
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 6, border: "1px solid var(--line-soft)" }}>
                  <span style={{ color: "var(--brand-blue)" }}>Total Grid:</span> 63×63px (7×7 units)
                </div>
              </div>

              <div style={{ background: "#09090b", padding: "16px 20px", borderRadius: 8, border: "1px solid #1f2026", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>Light Surface Treatment</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>For documentation & white backgrounds</div>
                </div>
                <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 6 }}>
                  <LoomSymbol size={28} surface="light" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Scale Verification */}
        <section
          id="scales"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: 28,
            marginBottom: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Layers size={18} style={{ color: "var(--brand-blue)" }} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Silhouette Scale Verification</h2>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 24 }}>
            The geometric L symbol maintains strong silhouette integrity and instant recognizability across all developer viewports:
          </p>

          <div
            style={{
              background: "#09090b",
              border: "1px solid #1f2026",
              borderRadius: 8,
              padding: "36px 24px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "flex-end",
            }}
          >
            {[
              { size: 16, label: "16px Favicon", desc: "Micro tab icon" },
              { size: 24, label: "24px Nav", desc: "Sidebar & header" },
              { size: 32, label: "32px App", desc: "Desktop tray icon" },
              { size: 48, label: "48px Card", desc: "Card headline" },
              { size: 64, label: "64px Hero", desc: "Display showcase" },
            ].map(({ size, label, desc }) => (
              <div key={size} style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <LoomSymbol size={size} />
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text)" }}>
                  {label}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Color Tokens */}
        <section
          id="colors"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: 28,
            marginBottom: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Canonical Color Tokens</h2>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--mono)" }}>Click to copy</span>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 24 }}>
            The restrained, dark palette establishing visual hierarchy and semantic feedback across Loom interfaces:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
            {colorTokens.map((token) => (
              <button
                key={token.hex}
                type="button"
                onClick={() => copyToClipboard(token.hex)}
                style={{
                  background: "#0c0d10",
                  border: "1px solid #1e1f24",
                  borderRadius: 8,
                  padding: 14,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "border-color 0.15s ease",
                }}
              >
                <div
                  style={{
                    height: 40,
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
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--brand-blue)", marginTop: 2 }}>{token.hex}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>{token.role}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Production Vectors */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: 28,
          }}
        >
          <h2 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 600 }}>Canonical Asset Inventory</h2>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 20 }}>
            Clean, scalable vector SVGs and structured design tokens maintained in <code>brand/</code>:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {[
              { path: "brand/symbol-l-dark.svg", desc: "Dark surface standalone L symbol (64×64)" },
              { path: "brand/symbol-l-light.svg", desc: "Light surface standalone L symbol (64×64)" },
              { path: "brand/symbol-app-icon.svg", desc: "Rounded container application icon (64×64)" },
              { path: "brand/favicon.svg", desc: "Optimized 32×32 browser favicon" },
              { path: "brand/logo-horizontal-dark.svg", desc: "Primary horizontal logo with wordmark" },
              { path: "brand/tokens.json", desc: "Standard W3C-compatible design tokens" },
            ].map((item) => (
              <div
                key={item.path}
                style={{
                  background: "#0c0d10",
                  border: "1px solid var(--line-soft)",
                  borderRadius: 6,
                  padding: "14px 16px",
                }}
              >
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--brand-blue)", fontWeight: 600 }}>
                  {item.path}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--line-soft)",
          padding: "24px",
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-3)",
          fontFamily: "var(--mono)",
        }}
      >
        LOOM CHANGE-IMPACT INTELLIGENCE · FIGMA MAKE CANONICAL BRAND IDENTITY
      </footer>
    </div>
  );
}
