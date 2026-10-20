// ========================================
// LISTA DE TAREAS
// ========================================

let tasks = JSON.parse(
    localStorage.getItem("tareas") || "[]"
);

let ultimoId = null;

function save() {

    localStorage.setItem(
        "tareas",
        JSON.stringify(tasks)
    );

    render();
    actualizarProgreso();
}


function addTask() {
    const input = document.getElementById("task-input");
    const priorityInput = document.getElementById("task-priority");

    const text = input.value.trim();
    const priority = priorityInput.value;

    if (!text) return;

    const nuevaTarea = {
        id: Date.now(),
        text: text,
        priority: priority,
        done: false,
        editing: false
    };

    tasks.push(nuevaTarea);

    ultimoId = nuevaTarea.id;

    input.value = "";
    priorityInput.value = "media";

    save();
}


function toggleDone(id) {

    const tarea =
        tasks.find(t => t.id === id);

    if (tarea) {
        tarea.done = !tarea.done;
    }

    save();
}

function startEdit(id) {

    tasks.forEach(
        t => t.editing = false
    );

    const tarea =
        tasks.find(t => t.id === id);

    if (tarea) {
        tarea.editing = true;
    }

    save();
}

function saveEdit(id) {

    const input =
        document.getElementById(
            "edit-" + id
        );

    const tarea =
        tasks.find(t => t.id === id);

    if (tarea && input) {

        const texto =
            input.value.trim();

        if (texto) {
            tarea.text = texto;
        }

        tarea.editing = false;
    }

    save();
}

function deleteTask(id) {

    tasks =
        tasks.filter(
            t => t.id !== id
        );

    save();
}

function clearCompleted() {

    tasks =
        tasks.filter(
            t => !t.done
        );

    save();
}

// Escapa caracteres especiales antes de meter el texto en innerHTML.
// Antes, una tarea con comillas (") rompía el <input> de edicion.
function escapeHtml(str) {

    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function render() {

    const list =
        document.getElementById(
            "task-list"
        );

    const counter =
        document.getElementById(
            "counter"
        );

    const pendientes =
        tasks.filter(
            t => !t.done
        ).length;

    counter.textContent =
        tasks.length === 0
        ? ""
        : `${pendientes} pendientes · ${tasks.length} total`;

    if (tasks.length === 0) {

        list.innerHTML =
            "<p>No hay tareas.</p>";

        return;
    }

    list.innerHTML =
        tasks.map(t => {
        const priority =
            ["baja", "media", "alta"].includes(t.priority)
                ? t.priority
                : "media";

        return `
        <div class="${t.id === ultimoId ? 'tarea-nueva' : ''}">

            <input
                type="checkbox"
                ${t.done ? "checked" : ""}
                onchange="toggleDone(${t.id})"
            >

            ${
                t.editing
                ?
                `<input
                    id="edit-${t.id}"
                    value="${escapeHtml(t.text)}"
                    onkeydown="if(event.key==='Enter') saveEdit(${t.id})"
                >`
                :
                `<span>${escapeHtml(t.text)}</span>`
            }

            <span class="task-priority priority-${priority}">${priority}</span>

            ${
                t.editing
                ?
                `<button onclick="saveEdit(${t.id})">
                    Guardar
                </button>`
                :
                `<button onclick="startEdit(${t.id})">
                    Editar
                </button>`
            }

            <button onclick="deleteTask(${t.id})">
                Eliminar
            </button>

        </div>
    `;
    }).join("");

    if (ultimoId !== null) {

        setTimeout(() => {
            ultimoId = null;
        }, 400);
    }
}

document
.getElementById("task-input")
.addEventListener("keydown", e => {

    if (e.key === "Enter") {
        addTask();
    }

});

// ========================================
// POMODORO
// ========================================

// Un único contador en segundos para la fase actual (estudio o descanso).
// Evitamos manejar horas/minutos/segundos por separado: eso era lo que
// generaba los bugs de sincronización del cronómetro.
let segundosRestantes = 25 * 60;

let minutosEstudio = 25;
let minutosDescanso = 5;

let totalSets = 1;
let setActual = 1;

let esDescanso = false;
let segundosAcumulados = 0;

let intervaloPomodoro = null;

// true desde que se aprieta "Iniciar" hasta que se aprieta "Reiniciar"
let iniciado = false;

const cronometro =
    document.getElementById("cronometro");

const minutosActuales =
    document.getElementById("minutosActuales");

const tiempo =
    document.getElementById("tiempo");

const tipoPomodoroSelect =
    document.getElementById("tipoPomodoro");

const cantidadSetsSelect =
    document.getElementById("cantidadSets");

const iniciarBtn =
    document.getElementById("iniciar");

const pausarBtn =
    document.getElementById("pausar");

const reiniciarBtn =
    document.getElementById("reiniciar");

function pintarTiempo() {

    const horas =
        Math.floor(segundosRestantes / 3600);

    const minutos =
        Math.floor((segundosRestantes % 3600) / 60);

    const segundos =
        segundosRestantes % 60;

    tiempo.textContent =
        `${String(horas).padStart(2,"0")}:` +
        `${String(minutos).padStart(2,"0")}:` +
        `${String(segundos).padStart(2,"0")}`;
}

// Lee el modo elegido ("25-5", "50-10", "90-20") y actualiza
// minutosEstudio / minutosDescanso.
function leerSeleccionModo() {

    const opcion =
        tipoPomodoroSelect.value;

    const partes =
        opcion.split("-");

    minutosEstudio =
        parseInt(partes[0]);

    minutosDescanso =
        parseInt(partes[1]);
}

function mostrarBotonesEnEjecucion() {
    iniciarBtn.style.display = "none";
    pausarBtn.style.display = "inline-block";
    reiniciarBtn.style.display = "inline-block";
}

function mostrarBotonInicial() {
    iniciarBtn.style.display = "inline-block";
    pausarBtn.style.display = "none";
    reiniciarBtn.style.display = "none";
}

function detenerIntervalo() {
    clearInterval(intervaloPomodoro);
    intervaloPomodoro = null;
}

function actualizarPomodoro() {

    segundosRestantes--;

    // El tiempo acumulado / progreso solo cuenta minutos de estudio,
    // no de descanso.
    if (!esDescanso) {

        segundosAcumulados++;

        const minutosAcumulados =
            Math.floor(segundosAcumulados / 60);

        const segundosMostrar =
            segundosAcumulados % 60;

        cronometro.textContent =
            String(minutosAcumulados).padStart(2, "0")
            + ":"
            + String(segundosMostrar).padStart(2, "0");

        minutosActuales.textContent =
            minutosAcumulados;

        actualizarProgreso();
    }

    if (segundosRestantes <= 0) {

        if (!esDescanso) {

            esDescanso = true;

            document.getElementById(
                "estadoPomodoro"
            ).textContent =
                "Descanso";

            segundosRestantes =
                minutosDescanso * 60;

        } else {

            setActual++;

            if (setActual > totalSets) {

                detenerIntervalo();

                segundosRestantes = 0;
                pintarTiempo();

                alert(
                    "Terminaste todas las sesiones de estudio."
                );

                return;
            }

            esDescanso = false;

            document.getElementById(
                "estadoPomodoro"
            ).textContent =
                "Estudio";

            segundosRestantes =
                minutosEstudio * 60;
        }
    }

    pintarTiempo();
}

iniciarBtn.addEventListener("click", () => {

    if (intervaloPomodoro !== null) return;

    leerSeleccionModo();

    totalSets =
        parseInt(cantidadSetsSelect.value);

    if (!iniciado) {

        // Primer inicio (o luego de un Reiniciar): arrancamos
        // una sesión nueva desde cero.
        esDescanso = false;
        setActual = 1;
        segundosAcumulados = 0;
        segundosRestantes = minutosEstudio * 60;

        document.getElementById(
            "estadoPomodoro"
        ).textContent =
            "Estudio";

        cronometro.textContent = "00:00";
        minutosActuales.textContent = "0";

        pintarTiempo();
    }

    objetivo =
        minutosEstudio * totalSets;

    document.getElementById(
        "objetivoMinutos"
    ).textContent = objetivo;

    iniciado = true;

    tipoPomodoroSelect.disabled = true;
    cantidadSetsSelect.disabled = true;

    mostrarBotonesEnEjecucion();

    intervaloPomodoro =
        setInterval(
            actualizarPomodoro,
            1000
        );
});

// El botón "Pausar" funciona como pausa/reanuda: mientras el
// cronómetro está iniciado, es el único control para eso.
pausarBtn.addEventListener("click", () => {

    if (intervaloPomodoro !== null) {

        detenerIntervalo();
        pausarBtn.textContent = "Reanudar";

    } else {

        intervaloPomodoro =
            setInterval(
                actualizarPomodoro,
                1000
            );

        pausarBtn.textContent = "Pausar";
    }
});

reiniciarBtn.addEventListener("click", () => {

    detenerIntervalo();

    esDescanso = false;
    setActual = 1;
    segundosAcumulados = 0;
    iniciado = false;

    document.getElementById(
        "estadoPomodoro"
    ).textContent =
        "Estudio";

    leerSeleccionModo();

    segundosRestantes =
        minutosEstudio * 60;

    pintarTiempo();

    cronometro.textContent = "00:00";
    minutosActuales.textContent = "0";

    tipoPomodoroSelect.disabled = false;
    cantidadSetsSelect.disabled = false;

    pausarBtn.textContent = "Pausar";

    mostrarBotonInicial();
});

// Cambiar el modo de estudio/descanso actualiza el número en
// pantalla al instante, sin necesidad de tocar Iniciar.
// Solo tiene efecto si el cronómetro no está corriendo.
tipoPomodoroSelect.addEventListener("change", () => {

    if (!iniciado) {

        leerSeleccionModo();

        segundosRestantes =
            minutosEstudio * 60;

        pintarTiempo();
    }
});

cantidadSetsSelect.addEventListener("change", () => {

    if (!iniciado) {

        totalSets =
            parseInt(cantidadSetsSelect.value);

        leerSeleccionModo();

        objetivo =
            minutosEstudio * totalSets;

        document.getElementById(
            "objetivoMinutos"
        ).textContent = objetivo;
    }
});

// Estado visual inicial del cronómetro, acorde a la opción
// seleccionada por defecto en el <select>.
leerSeleccionModo();
segundosRestantes = minutosEstudio * 60;
pintarTiempo();
mostrarBotonInicial();

// ========================================
// PROGRESO
// ========================================

let objetivo = 60;

document
.getElementById("objetivoMinutos")
.textContent = objetivo;

const barraProgreso =
    document.getElementById(
        "barraProgreso"
    );

const porcentaje =
    document.getElementById(
        "porcentaje"
    );

function actualizarProgreso() {

    const completadas =
        tasks.filter(
            t => t.done
        ).length;

    document
    .getElementById(
        "contadorTareas"
    )
    .textContent = completadas;

    let progresoTotal = 0;

    if (tasks.length > 0) {

        progresoTotal =
            (completadas / tasks.length) * 100;
    }

    if (progresoTotal > 100) {
        progresoTotal = 100;
    }

    barraProgreso.value =
        progresoTotal;

    porcentaje.textContent =
        Math.floor(progresoTotal)
        + "%";

    if (progresoTotal >= 100 && tasks.length > 0) {

        clearInterval(intervaloPomodoro);

        intervaloPomodoro = null;

        mostrarFelicitacion();
        
    }
}

// ========================================
// MENU MOBILE
// ========================================

const sidebar =
    document.getElementById("sidebar");

const sidebarToggle =
    document.getElementById("sidebarToggle");

if (sidebarToggle) {

    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    document.querySelectorAll(".nav-item").forEach(link => {
        link.addEventListener("click", () => {
            sidebar.classList.remove("open");
        });
    });
}

// ========================================
// INICIO
// ========================================

render();
actualizarProgreso();
function mostrarFelicitacion(){
    document.getElementById("mensajeFinal").classList.add("mostrar");
    confetti({
        particleCount: 200,
        spread: 120,
        origin: {
            y: 0.6
        }
    });
}
// ========================================
// SALUDO Y FECHA
// ========================================

function actualizarSaludo() {
    const hora = new Date().getHours();
    const saludoEl = document.getElementById("saludo");

    let mensaje = "Buenas noches ";
    if (hora >= 6 && hora < 12) mensaje = "Buen día ";
    else if (hora >= 12 && hora < 19) mensaje = "Buenas tardes ";

    saludoEl.textContent = mensaje;

    const fechaEl = document.getElementById("fecha-actual");
    const opciones = { weekday: "long", day: "numeric", month: "long" };
    fechaEl.textContent = new Date().toLocaleDateString("es-AR", opciones);
}
actualizarSaludo();

// Botones del modal final
document
.getElementById("seguirEstudiando")
.addEventListener("click", ()=>{

    document
    .getElementById("mensajeFinal")
    .classList.remove("mostrar");

});
document
.getElementById("terminarEstudio")
.addEventListener("click", ()=>{

    document
    .getElementById("mensajeFinal")
    .classList.remove("mostrar");

    alert("¡Hasta la próxima! ");

});
// Si el usuario cambia de pestaña mientras el cronómetro está
// corriendo en fase de Estudio, al volver le mostramos una imagen
// "reto" con un botón para cerrarla y retomar el estudio.
const CLAVE_RETO_PENDIENTE = "lockin_reto_pendiente";
let seDistrajoEnEstudio =
    sessionStorage.getItem(CLAVE_RETO_PENDIENTE) === "true";

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        document.title = "¿Te fuiste? 👀";

        if (intervaloPomodoro !== null && !esDescanso) {
            seDistrajoEnEstudio = true;
            sessionStorage.setItem(CLAVE_RETO_PENDIENTE, "true");
        }

    } else {
        document.title = "LockIn - Pomodoro y Tareas";

        if (seDistrajoEnEstudio) {
            seDistrajoEnEstudio = false;
            sessionStorage.removeItem(CLAVE_RETO_PENDIENTE);
            mostrarReto();
        }
    }
});

function mostrarReto() {

    const frases = [
        "Volver a estudiar",
        "¡Me mantendré concentrado esta vez!",
        "¡No más distracciones!"

    ];

    const frase =
        frases[Math.floor(Math.random() * frases.length)];

    document.getElementById("cerrarReto").textContent = frase;

    document.getElementById("mensajeVolviste").classList.add("mostrar");
}

if (seDistrajoEnEstudio) {
    seDistrajoEnEstudio = false;
    sessionStorage.removeItem(CLAVE_RETO_PENDIENTE);
    mostrarReto();
}

document
.getElementById("cerrarReto")
.addEventListener("click", () => {

    document
    .getElementById("mensajeVolviste")
    .classList.remove("mostrar");

});