const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");

function cerrarSidebar() {
  sidebar.classList.remove("open");
  sidebarToggle.setAttribute("aria-expanded", "false");
}

sidebarToggle.addEventListener("click", () => {
  const estaAbierto = sidebar.classList.toggle("open");
  sidebarToggle.setAttribute("aria-expanded", String(estaAbierto));
});

sidebarClose.addEventListener("click", cerrarSidebar);
document.querySelectorAll(".nav-item").forEach((link) => {
  link.addEventListener("click", cerrarSidebar);
});

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  if (safeSeconds < 60) return `${safeSeconds} seg`;
  const minutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours} h ${remainingMinutes} min` : `${minutes} min`;
}

function getDaySeconds(day) {
  if (!day || typeof day !== "object") return 0;
  if (Number.isFinite(Number(day.seconds))) return Math.max(0, Number(day.seconds));
  return Object.values(day.subjects || {}).reduce(
    (total, seconds) => total + Math.max(0, Number(seconds) || 0),
    0,
  );
}

function getPeriodDays(start, count, history) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      seconds: getDaySeconds(history[dateKey(date)]),
      subjects: history[dateKey(date)]?.subjects || {},
    };
  });
}

function renderChart(container, days, labelFormatter) {
  container.replaceChildren();
  const maximum = Math.max(0, ...days.map((day) => day.seconds));

  days.forEach((day) => {
    const columna = document.createElement("div");
    columna.className = "study-day";

    const barra = document.createElement("div");
    barra.className = "study-day-bar";
    barra.setAttribute(
      "aria-label",
      `${day.date.toLocaleDateString("es-AR")}: ${formatTime(day.seconds)}`,
    );
    barra.title = `${day.date.toLocaleDateString("es-AR")}: ${formatTime(day.seconds)}`;

    const relleno = document.createElement("div");
    relleno.className = "study-day-bar-fill";
    relleno.style.setProperty(
      "--bar-height",
      `${maximum > 0 ? Math.max(4, (day.seconds / maximum) * 100) : 0}%`,
    );
    barra.appendChild(relleno);

    const etiqueta = document.createElement("span");
    etiqueta.className = "study-day-label";
    etiqueta.textContent = labelFormatter(day.date);
    columna.append(barra, etiqueta);
    container.appendChild(columna);
  });
}

function renderSubjects(container, days, subjects, totalSeconds) {
  container.replaceChildren();
  if (totalSeconds === 0) {
    const mensaje = document.createElement("p");
    mensaje.className = "progress-empty";
    mensaje.textContent = "Todavía no hay tiempo de estudio en este período.";
    container.appendChild(mensaje);
    return;
  }

  const totals = {};
  days.forEach((day) => {
    Object.entries(day.subjects).forEach(([subjectId, seconds]) => {
      totals[subjectId] = (totals[subjectId] || 0) + Math.max(0, Number(seconds) || 0);
    });
  });

  Object.entries(totals)
    .sort(([, first], [, second]) => second - first)
    .forEach(([subjectId, seconds]) => {
      const materia = subjects.find((item) => item.id === subjectId);
      const fila = document.createElement("div");
      fila.className = "progress-subject-item";

      const nombre = document.createElement("span");
      nombre.textContent = materia?.name || "Materia";

      const tiempo = document.createElement("strong");
      tiempo.textContent = formatTime(seconds);

      const barra = document.createElement("progress");
      barra.max = totalSeconds;
      barra.value = seconds;
      barra.setAttribute("aria-label", `${nombre.textContent}: ${formatTime(seconds)}`);

      fila.append(nombre, tiempo, barra);
      container.appendChild(fila);
    });
}

function renderPeriod({ days, totalElement, activeDaysElement, chart, subjectsElement, subjects, labelFormatter }) {
  const totalSeconds = days.reduce((total, day) => total + day.seconds, 0);
  const activeDays = days.filter((day) => day.seconds > 0).length;
  totalElement.textContent = formatTime(totalSeconds);
  activeDaysElement.textContent = days.length === 7
    ? `${activeDays} de 7`
    : `${activeDays} ${activeDays === 1 ? "día" : "días"}`;
  renderChart(chart, days, labelFormatter);
  renderSubjects(subjectsElement, days, subjects, totalSeconds);
}

function actualizarProgreso() {
  window.LockInStudyData.advancePomodoro();

  const now = new Date();
  const startOfWeek = new Date(now);
  const daysSinceMonday = (now.getDay() + 6) % 7;
  startOfWeek.setDate(now.getDate() - daysSinceMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekDays = getPeriodDays(startOfWeek, 7, window.LockInStudyData.readStudyHistory());
  const monthDays = getPeriodDays(
    startOfMonth,
    now.getDate(),
    window.LockInStudyData.readStudyHistory(),
  );
  const subjects = window.LockInStudyData.readSubjects();

  renderPeriod({
    days: weekDays,
    totalElement: document.getElementById("weekTotal"),
    activeDaysElement: document.getElementById("weekDays"),
    chart: document.getElementById("weekChart"),
    subjectsElement: document.getElementById("weekSubjects"),
    subjects,
    labelFormatter: (date) =>
      date.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", ""),
  });
  renderPeriod({
    days: monthDays,
    totalElement: document.getElementById("monthTotal"),
    activeDaysElement: document.getElementById("monthDays"),
    chart: document.getElementById("monthChart"),
    subjectsElement: document.getElementById("monthSubjects"),
    subjects,
    labelFormatter: (date) => String(date.getDate()),
  });

  const user = window.LockInStudyData.readUser();
  const hour = now.getHours();
  const greeting = hour >= 6 && hour < 12
    ? "Buen día"
    : hour >= 12 && hour < 19
      ? "Buenas tardes"
      : "Buenas noches";
  document.getElementById("saludo").textContent =
    `${greeting}, ${user.name || "usuario"}`;
  document.getElementById("fecha-actual").textContent =
    now.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  document.getElementById("weekRange").textContent =
    `${startOfWeek.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} - ` +
    `${new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6)
      .toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`;
  document.getElementById("monthRange").textContent =
    now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

actualizarProgreso();
setInterval(actualizarProgreso, 1000);
