// ======================================================
// PERSONALIZACIÓN DE LA INTERFAZ
// ======================================================

const CLAVE_STORAGE = "lockin_personalizacion";

const PALETAS = [
    {
        id: "predeterminado",
        nombre: "Predeterminado",
        colores: ["#222526", "#353A3E", "#E0E0E0", "#1A1A1A", "#BFBFBF"],
        accent: "#353A3E",
        accentDark: "#1A1A1A",
        tint: "#E0E0E0",
        bg: "#C8C8C8",
        text: "#222526"
    },
    {
        id: "rosa",
        nombre: "Rosa",
        colores: ["#720002", "#DB8291", "#F4D6DC"],
        accent: "#DB8291",
        accentDark: "#720002",
        tint: "#F4D6DC",
        bg: "#F4D6DC",
        text: "#720002"
    },
    {
        id: "marron",
        nombre: "Marrón",
        colores: ["#342519", "#684F36", "#B39977", "#EDE6D9"],
        accent: "#684F36",
        accentDark: "#342519",
        tint: "#EDE6D9",
        bg: "#EDE6D9",
        text: "#342519"
    },
    {
        id: "verde",
        nombre: "Verde",
        colores: ["#354220", "#47622A", "#799831", "#93E651", "#DFE7D1"],
        accent: "#47622A",
        accentDark: "#354220",
        tint: "#DFE7D1",
        bg: "#DFE7D1",
        text: "#354220"
    },
    {
        id: "azul",
        nombre: "Azul",
        colores: ["#16294A", "#3B587D", "#9E8C7C", "#F7E7CE", "#F5F4F0"],
        accent: "#3B587D",
        accentDark: "#16294A",
        tint: "#F5F4F0",
        bg: "#E8EFF8",
        text: "#16294A"
    }
];

const CONFIG_DEFAULT = {
    paletaId: "predeterminado",
    modo: "claro",
    colorFondo: null,
    fondo: null,
    desenfoque: 0,
    opacidad: 1
};

function obtenerPaleta(id) {
    return PALETAS.find(p => p.id === id) || PALETAS[0];
}

function hexToRgb(hex) {
    const limpio = hex.replace("#", "");
    const r = parseInt(limpio.substring(0, 2), 16);
    const g = parseInt(limpio.substring(2, 4), 16);
    const b = parseInt(limpio.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}

let configGuardada = cargarConfig();
let configBorrador = { ...configGuardada };

function cargarConfig() {
    try {
        const guardado = localStorage.getItem(CLAVE_STORAGE);
        if (!guardado) return { ...CONFIG_DEFAULT };
        return { ...CONFIG_DEFAULT, ...JSON.parse(guardado) };
    } catch {
        return { ...CONFIG_DEFAULT };
    }
}

function guardarConfig(config) {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(config));
}

function aplicarConfig(config) {
    const paleta = obtenerPaleta(config.paletaId);
    const raiz = document.documentElement.style;

    document.documentElement.setAttribute("data-modo", config.modo);

    if (config.modo === "oscuro") {
        raiz.removeProperty("--bg-base");
        raiz.removeProperty("--text-base");
    } else {
        raiz.setProperty("--bg-base", config.colorFondo || paleta.bg);
        raiz.setProperty("--text-base", paleta.text);
    }

    raiz.setProperty("--accent-color", paleta.accent);
    raiz.setProperty("--accent-dark", paleta.accentDark);
    raiz.setProperty("--accent-dark-rgb", hexToRgb(paleta.accentDark));
    raiz.setProperty("--accent-tint", paleta.tint);
    raiz.setProperty("--panel-opacity", config.opacidad);
    raiz.setProperty("--bg-blur", (config.desenfoque || 0) + "px");

    if (config.colorFondo) {
        raiz.setProperty("--bg-color-custom", config.colorFondo);
    } else {
        raiz.removeProperty("--bg-color-custom");
    }

    if (config.fondo) {
        raiz.setProperty("--bg-image", `url(${config.fondo})`);
    } else {
        raiz.removeProperty("--bg-image");
    }
}

aplicarConfig(configGuardada);

document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("personalizacionOverlay");
    const abrirBtn = document.getElementById("abrirPersonalizacion");
    const cerrarBtn = document.getElementById("cerrarPersonalizacion");
    const paletasCont = document.getElementById("paletasGrid");
    const modoCont = document.getElementById("modoToggle");
    const inputFondo = document.getElementById("inputFondo");
    const inputColorFondo = document.getElementById("inputColorFondo");
    const quitarFondoBtn = document.getElementById("quitarFondo");
    const fondoPreview = document.getElementById("fondoPreview");
    const slider = document.getElementById("opacidadSlider");
    const opacidadValor = document.getElementById("opacidadValor");
    const desenfoqueSlider = document.getElementById("desenfoqueSlider");
    const desenfoqueValor = document.getElementById("desenfoqueValor");
    const guardarBtn = document.getElementById("guardarPersonalizacion");
    const cancelarBtn = document.getElementById("cancelarPersonalizacion");
    const restablecerBtn = document.getElementById("restablecerPersonalizacion");

    if (!overlay || !abrirBtn) return;

    PALETAS.forEach(paleta => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "paleta-opcion";
        btn.dataset.paletaId = paleta.id;

        const preview = document.createElement("div");
        preview.className = "paleta-preview";
        paleta.colores.forEach(color => {
            const franja = document.createElement("span");
            franja.style.backgroundColor = color;
            preview.appendChild(franja);
        });

        const label = document.createElement("small");
        label.textContent = paleta.nombre;

        btn.appendChild(preview);
        btn.appendChild(label);

        btn.addEventListener("click", () => {
            configBorrador.paletaId = paleta.id;
            pintarUI();
            aplicarConfig(configBorrador);
        });

        paletasCont.appendChild(btn);
    });

    const MODOS = [
        { id: "claro", nombre: "Modo claro", icono: "bi-sun" },
        { id: "oscuro", nombre: "Modo oscuro", icono: "bi-moon-stars" }
    ];

    MODOS.forEach(modo => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "modo-opcion";
        btn.dataset.modoId = modo.id;
        btn.innerHTML = `<i class="bi ${modo.icono}"></i> ${modo.nombre}`;

        btn.addEventListener("click", () => {
            configBorrador.modo = modo.id;
            pintarUI();
            aplicarConfig(configBorrador);
        });

        modoCont.appendChild(btn);
    });

    function pintarUI() {
        [...paletasCont.children].forEach(btn => {
            btn.classList.toggle("selected", btn.dataset.paletaId === configBorrador.paletaId);
        });

        [...modoCont.children].forEach(btn => {
            btn.classList.toggle("selected", btn.dataset.modoId === configBorrador.modo);
        });

        fondoPreview.style.backgroundImage = configBorrador.fondo
            ? `url(${configBorrador.fondo})`
            : "none";
        fondoPreview.style.backgroundColor = configBorrador.colorFondo || "";

        inputColorFondo.value = configBorrador.colorFondo || "#C8C8C8";

        slider.value = configBorrador.opacidad;
        opacidadValor.textContent = Math.round(configBorrador.opacidad * 100) + "%";

        desenfoqueSlider.value = configBorrador.desenfoque || 0;
        desenfoqueValor.textContent = (configBorrador.desenfoque || 0) + "px";
    }

    function abrirPanel() {
        configBorrador = { ...configGuardada };
        pintarUI();
        aplicarConfig(configBorrador);
        overlay.classList.add("mostrar");
    }

    function cerrarPanel() {
        overlay.classList.remove("mostrar");
    }

    abrirBtn.addEventListener("click", abrirPanel);

    cerrarBtn.addEventListener("click", () => {
        aplicarConfig(configGuardada);
        cerrarPanel();
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            aplicarConfig(configGuardada);
            cerrarPanel();
        }
    });

    inputColorFondo.addEventListener("input", () => {
        configBorrador.colorFondo = inputColorFondo.value;
        pintarUI();
        aplicarConfig(configBorrador);
    });

    inputFondo.addEventListener("change", () => {
        const archivo = inputFondo.files[0];
        if (!archivo) return;

        const lector = new FileReader();
        lector.onload = () => {
            configBorrador.fondo = lector.result;
            pintarUI();
            aplicarConfig(configBorrador);
        };
        lector.readAsDataURL(archivo);
    });

    quitarFondoBtn.addEventListener("click", () => {
        configBorrador.fondo = null;
        configBorrador.colorFondo = null;
        configBorrador.desenfoque = 0;
        inputFondo.value = "";
        pintarUI();
        aplicarConfig(configBorrador);
    });

    slider.addEventListener("input", () => {
        configBorrador.opacidad = parseFloat(slider.value);
        opacidadValor.textContent = Math.round(configBorrador.opacidad * 100) + "%";
        aplicarConfig(configBorrador);
    });

    desenfoqueSlider.addEventListener("input", () => {
        configBorrador.desenfoque = parseInt(desenfoqueSlider.value, 10);
        desenfoqueValor.textContent = configBorrador.desenfoque + "px";
        aplicarConfig(configBorrador);
    });

    guardarBtn.addEventListener("click", () => {
        configGuardada = { ...configBorrador };
        guardarConfig(configGuardada);
        aplicarConfig(configGuardada);
        cerrarPanel();
    });

    cancelarBtn.addEventListener("click", () => {
        aplicarConfig(configGuardada);
        cerrarPanel();
    });

    restablecerBtn.addEventListener("click", () => {
        configBorrador = { ...CONFIG_DEFAULT };
        configGuardada = { ...CONFIG_DEFAULT };
        guardarConfig(configGuardada);
        inputFondo.value = "";
        pintarUI();
        aplicarConfig(configGuardada);
    });
});