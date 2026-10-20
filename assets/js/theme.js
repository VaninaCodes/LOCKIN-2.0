(() => {
const PALETAS_TEMA = {
  predeterminado: {
    accent: "#353A3E",
    accentDark: "#1A1A1A",
    tint: "#E0E0E0",
    bg: "#C8C8C8",
    text: "#222526",
  },
  rosa: {
    accent: "#DB8291",
    accentDark: "#720002",
    tint: "#F4D6DC",
    bg: "#F4D6DC",
    text: "#720002",
  },
  marron: {
    accent: "#684F36",
    accentDark: "#342519",
    tint: "#EDE6D9",
    bg: "#EDE6D9",
    text: "#342519",
  },
  verde: {
    accent: "#47622A",
    accentDark: "#354220",
    tint: "#DFE7D1",
    bg: "#DFE7D1",
    text: "#354220",
  },
  azul: {
    accent: "#3B587D",
    accentDark: "#16294A",
    tint: "#F5F4F0",
    bg: "#E8EFF8",
    text: "#16294A",
  },
};

try {
  const stored = localStorage.getItem("lockin_personalizacion");
  if (stored) {
    const config = JSON.parse(stored);
    const palette = Object.prototype.hasOwnProperty.call(
      PALETAS_TEMA,
      config.paletaId,
    )
      ? PALETAS_TEMA[config.paletaId]
      : PALETAS_TEMA.predeterminado;
    const root = document.documentElement;
    const styles = root.style;
    const mode = config.modo === "oscuro" ? "oscuro" : "claro";

    root.setAttribute("data-modo", mode);
    styles.setProperty("--accent-color", palette.accent);
    styles.setProperty("--accent-dark", palette.accentDark);
    styles.setProperty("--accent-dark-rgb", hexToRgb(palette.accentDark));
    styles.setProperty("--accent-tint", palette.tint);
    styles.setProperty("--panel-opacity", config.opacidad ?? 1);
    styles.setProperty("--bg-blur", `${config.desenfoque || 0}px`);

    if (mode === "oscuro") {
      styles.removeProperty("--bg-base");
      styles.removeProperty("--text-base");
    } else {
      styles.setProperty("--bg-base", config.colorFondo || palette.bg);
      styles.setProperty("--text-base", palette.text);
    }

    if (config.colorFondo) {
      styles.setProperty("--bg-color-custom", config.colorFondo);
    }
    if (config.fondo) {
      styles.setProperty("--bg-image", `url(${config.fondo})`);
    }
  }
} catch (error) {
  console.warn("No se pudo aplicar la personalización guardada.", error);
}

function hexToRgb(hex) {
  const color = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(color.slice(index, index + 2), 16)).join(", ");
}
})();
