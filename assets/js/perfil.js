// ======================================================
// ELEMENTOS DEL HTML
// ======================================================

// foto
const inputFoto = document.getElementById("inputFoto");
const fotoPerfil = document.getElementById("fotoPerfil");
const sinFotoPerfil = document.getElementById("sinFotoPerfil");

// modo ver
const verPerfil = document.getElementById("verPerfil");
const verNombre = document.getElementById("verNombre");
const verUsuario = document.getElementById("verUsuario");
const verPronombres = document.getElementById("verPronombres");
const verBio = document.getElementById("verBio");
const botonEditar = document.getElementById("botonEditar");

// modo editar
const editarPerfil = document.getElementById("editarPerfil");
const inputUser = document.getElementById("inputUser");
const inputNombre = document.getElementById("inputNombre");
const inputPronombres = document.getElementById("inputPronombres");
const inputBio = document.getElementById("inputBio");
const inputInstitucion = document.getElementById("inputInstitucion");
const inputCuatrimestre = document.getElementById("inputCuatrimestre");
const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("botonCancelar");
const verInstitucion = document.getElementById("verInstitucion");
const verCuatrimestre = document.getElementById("verCuatrimestre");

// ======================================================
// CAMBIAR FOTO
// ======================================================

inputFoto.addEventListener("change", async function () {
    const archivo = inputFoto.files[0];
    if (!archivo) return;

    const esGif = archivo.type === "image/gif" || /\.gif$/i.test(archivo.name);
    if (!archivo.type.startsWith("image/") && !esGif) {
        window.alert("Elegí un archivo de imagen válido.");
        inputFoto.value = "";
        return;
    }

    try {
        const fotoGuardada = await window.LockInStudyData.saveProfilePhoto(archivo);
        fotoPerfil.src = fotoGuardada;
        fotoPerfil.hidden = false;
        sinFotoPerfil.hidden = true;
    } catch (error) {
        console.error("No se pudo guardar la foto de perfil.", error);
        window.alert("No se pudo guardar la imagen. Probá con otro archivo.");
    } finally {
        inputFoto.value = "";
    }
});

// ======================================================
// PASAR A MODO EDITAR
// ======================================================

botonEditar.addEventListener("click", function () {

    // cargamos en los inputs lo que se está mostrando ahora
    inputUser.value = verUsuario.textContent;
    inputNombre.value = verNombre.textContent;
    inputPronombres.value = verPronombres.textContent;
    inputBio.value = verBio.textContent;
    inputInstitucion.value =
        verInstitucion.textContent === "Sin indicar" ? "" : verInstitucion.textContent;
    inputCuatrimestre.value =
        verCuatrimestre.textContent === "Sin indicar" ? "" : verCuatrimestre.textContent;

    // escondemos "ver" y mostramos "editar"
    verPerfil.hidden = true;
    editarPerfil.hidden = false;

    inputNombre.focus();
});

// ======================================================
// CANCELAR: volver a modo ver sin guardar cambios
// ======================================================

botonCancelar.addEventListener("click", function () {

    editarPerfil.hidden = true;
    verPerfil.hidden = false;
});

// ======================================================
// GUARDAR: pasar los datos del formulario al modo ver
// ======================================================

botonGuardar.addEventListener("click", function () {
    if (
        inputCuatrimestre.value &&
        (!Number.isInteger(Number(inputCuatrimestre.value)) ||
            Number(inputCuatrimestre.value) < 1)
    ) {
        inputCuatrimestre.setCustomValidity("Ingresá un número de cuatrimestre válido.");
        inputCuatrimestre.reportValidity();
        inputCuatrimestre.setCustomValidity("");
        return;
    }

    verUsuario.textContent = inputUser.value;
    verNombre.textContent = inputNombre.value;
    verPronombres.textContent = inputPronombres.value;
    verBio.textContent = inputBio.value;
    verInstitucion.textContent = inputInstitucion.value.trim() || "Sin indicar";
    verCuatrimestre.textContent = inputCuatrimestre.value || "Sin indicar";

    guardarEnStorage().catch((error) => {
        console.error("No se pudo guardar el perfil.", error);
        window.alert("No se pudieron guardar los cambios del perfil.");
    });

    editarPerfil.hidden = true;
    verPerfil.hidden = false;
});

// ======================================================
// GUARDAR / CARGAR DE localStorage
// ======================================================

async function guardarEnStorage() {

    const datosPerfil = {
        usuario: verUsuario.textContent,
        nombre: verNombre.textContent,
        pronombres: verPronombres.textContent,
        bio: verBio.textContent,
        institucion: verInstitucion.textContent === "Sin indicar" ? "" : verInstitucion.textContent,
        cuatrimestre: verCuatrimestre.textContent === "Sin indicar" ? "" : verCuatrimestre.textContent
    };

    await window.LockInStudyData.saveProfile(datosPerfil);
}

const usuarioActual = window.LockInStudyData.readUser();

async function cargarPerfil() {
    const datosPerfil = await window.LockInStudyData.readProfile();

    if (Object.keys(datosPerfil).length > 0) {
        verUsuario.textContent = datosPerfil.usuario || usuarioActual.name || verUsuario.textContent;
        verNombre.textContent = datosPerfil.nombre || usuarioActual.name || verNombre.textContent;
        verPronombres.textContent = datosPerfil.pronombres || verPronombres.textContent;
        verBio.textContent = datosPerfil.bio || verBio.textContent;
        verInstitucion.textContent = datosPerfil.institucion || "Sin indicar";
        verCuatrimestre.textContent = datosPerfil.cuatrimestre || "Sin indicar";
    } else if (usuarioActual.name) {
        verUsuario.textContent = usuarioActual.name;
        verNombre.textContent = usuarioActual.name;
    }

    const fotoGuardada = await window.LockInStudyData.readProfilePhoto();
    if (fotoGuardada) {
        fotoPerfil.src = fotoGuardada;
        fotoPerfil.hidden = false;
        sinFotoPerfil.hidden = true;
    } else {
        fotoPerfil.removeAttribute("src");
        fotoPerfil.hidden = true;
        sinFotoPerfil.hidden = false;
    }

    actualizarSaludoPerfil(usuarioActual.name || datosPerfil.usuario || "usuario");
}

function actualizarSaludoPerfil(nombreUsuario) {
    const hora = new Date().getHours();
    let mensaje = "Buenas noches";
    if (hora >= 6 && hora < 12) mensaje = "Buen día";
    else if (hora >= 12 && hora < 19) mensaje = "Buenas tardes";

    document.getElementById("saludo").textContent = `${mensaje}, ${nombreUsuario}`;
    document.getElementById("fecha-actual").textContent =
        new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
}

cargarPerfil().catch((error) => {
    console.error("No se pudo cargar el perfil.", error);
    window.alert("No se pudo cargar el perfil guardado.");
});

const pomodoroPerfil = document.getElementById("pomodoroPerfil");
const tiempoPomodoroPerfil = document.getElementById("tiempoPomodoroPerfil");
const estadoPomodoroPerfil = document.getElementById("estadoPomodoroPerfil");
const controlPomodoroPerfil = document.getElementById("controlPomodoroPerfil");

function actualizarPomodoroPerfil() {
    const estado = window.LockInStudyData.advancePomodoro();
    if (!estado) {
        pomodoroPerfil.hidden = true;
        return;
    }

    const materia = window.LockInStudyData
        .readSubjects()
        .find((item) => item.id === estado.subjectId);
    const horas = Math.floor(estado.secondsRemaining / 3600);
    const minutos = Math.floor((estado.secondsRemaining % 3600) / 60);
    const segundos = estado.secondsRemaining % 60;

    tiempoPomodoroPerfil.textContent =
        `${String(horas).padStart(2, "0")}:` +
        `${String(minutos).padStart(2, "0")}:` +
        `${String(segundos).padStart(2, "0")}`;
    estadoPomodoroPerfil.textContent = estado.completed
        ? "Sesión terminada"
        : `${estado.running ? "En curso" : "Pausado"} · ` +
          `${estado.isBreak ? "Descanso" : "Estudio"} · ` +
          `${materia?.name || "Materia"}`;
    controlPomodoroPerfil.textContent = estado.running ? "Pausar" : "Reanudar";
    controlPomodoroPerfil.disabled = estado.completed;
    pomodoroPerfil.hidden = false;
}

controlPomodoroPerfil.addEventListener("click", () => {
    const estado = window.LockInStudyData.getPomodoroState();
    if (!estado || estado.completed) return;

    if (estado.running) {
        window.LockInStudyData.pausePomodoro();
    } else {
        window.LockInStudyData.resumePomodoro();
    }
    actualizarPomodoroPerfil();
});

actualizarPomodoroPerfil();
setInterval(actualizarPomodoroPerfil, 1000);

const formMateria = document.getElementById("formMateria");
const nombreMateria = document.getElementById("nombreMateria");
const guardarMateria = document.getElementById("guardarMateria");
const cancelarEdicionMateria = document.getElementById("cancelarEdicionMateria");
const listaMaterias = document.getElementById("listaMaterias");
const errorMateria = document.getElementById("errorMateria");
let materias = window.LockInStudyData.readSubjects();
let materiaEditandoId = null;

function renderMaterias() {
    const progreso = window.LockInStudyData.readProgress();
    listaMaterias.replaceChildren();

    if (materias.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.textContent = "Todavía no agregaste materias.";
        listaMaterias.appendChild(mensaje);
        return;
    }

    materias.forEach((materia) => {
        const fila = document.createElement("div");
        fila.className = "materia-item";

        const nombre = document.createElement("strong");
        nombre.textContent = materia.name;

        const tiempo = document.createElement("span");
        tiempo.textContent = `Tiempo estudiado: ${formatearTiempo(progreso[materia.id]?.seconds || 0)}`;

        const acciones = document.createElement("div");
        acciones.className = "materia-actions";

        const editar = document.createElement("button");
        editar.type = "button";
        editar.textContent = "Editar";
        editar.addEventListener("click", () => {
            materiaEditandoId = materia.id;
            nombreMateria.value = materia.name;
            guardarMateria.textContent = "Guardar cambios";
            cancelarEdicionMateria.hidden = false;
            errorMateria.textContent = "";
            nombreMateria.focus();
        });

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "btn-clear";
        eliminar.textContent = "Eliminar";
        eliminar.addEventListener("click", () => {
            if (!window.confirm(`¿Eliminar la materia "${materia.name}" y su progreso?`)) {
                return;
            }
            materias = materias.filter((item) => item.id !== materia.id);
            window.LockInStudyData.saveSubjects(materias);
            window.LockInStudyData.removeProgress(materia.id);
            renderMaterias();
        });

        acciones.append(editar, eliminar);
        fila.append(nombre, tiempo, acciones);
        listaMaterias.appendChild(fila);
    });
}

function formatearTiempo(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`;
}

function limpiarEdicionMateria() {
    materiaEditandoId = null;
    nombreMateria.value = "";
    guardarMateria.textContent = "Agregar materia";
    cancelarEdicionMateria.hidden = true;
}

formMateria.addEventListener("submit", (event) => {
    event.preventDefault();
    const nombre = nombreMateria.value.trim();
    if (!nombre) return;

    const duplicada = materias.some(
        (materia) =>
            materia.id !== materiaEditandoId &&
            materia.name.toLocaleLowerCase() === nombre.toLocaleLowerCase(),
    );
    if (duplicada) {
        errorMateria.textContent = "Ya existe una materia con ese nombre.";
        return;
    }

    if (materiaEditandoId) {
        materias = materias.map((materia) =>
            materia.id === materiaEditandoId ? { ...materia, name: nombre } : materia,
        );
    } else {
        materias.push({
            id: window.crypto?.randomUUID
                ? window.crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: nombre,
        });
    }

    window.LockInStudyData.saveSubjects(materias);
    errorMateria.textContent = "";
    limpiarEdicionMateria();
    renderMaterias();
});

cancelarEdicionMateria.addEventListener("click", limpiarEdicionMateria);
renderMaterias();