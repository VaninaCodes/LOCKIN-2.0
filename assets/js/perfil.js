// ======================================================
// ELEMENTOS DEL HTML
// ======================================================

// foto
const inputFoto = document.getElementById("inputFoto");
const fotoPerfil = document.getElementById("fotoPerfil");

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
const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("botonCancelar");

// ======================================================
// CAMBIAR FOTO
// ======================================================

inputFoto.addEventListener("change", function () {

    const archivo = inputFoto.files[0];
    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = function () {
        fotoPerfil.src = lector.result;
        guardarEnStorage(); // guardamos apenas cambia, no hace falta tocar "Guardar"
    };

    lector.readAsDataURL(archivo);
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

    verUsuario.textContent = inputUser.value;
    verNombre.textContent = inputNombre.value;
    verPronombres.textContent = inputPronombres.value;
    verBio.textContent = inputBio.value;

    guardarEnStorage();

    editarPerfil.hidden = true;
    verPerfil.hidden = false;
});

// ======================================================
// GUARDAR / CARGAR DE localStorage
// ======================================================

function guardarEnStorage() {

    const datosPerfil = {
        usuario: verUsuario.textContent,
        nombre: verNombre.textContent,
        pronombres: verPronombres.textContent,
        bio: verBio.textContent,
        foto: fotoPerfil.src
    };

    localStorage.setItem("perfil", JSON.stringify(datosPerfil));
}

// al abrir la página, mostramos lo que ya estaba guardado
const guardado = localStorage.getItem("perfil");

if (guardado) {

    const datosPerfil = JSON.parse(guardado);

    verUsuario.textContent = datosPerfil.usuario || verUsuario.textContent;
    verNombre.textContent = datosPerfil.nombre;
    verPronombres.textContent = datosPerfil.pronombres || verPronombres.textContent;
    verBio.textContent = datosPerfil.bio;
    fotoPerfil.src = datosPerfil.foto;
}