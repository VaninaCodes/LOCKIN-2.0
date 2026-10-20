const API_URL = 'http://localhost:3001/api/users';

// ----- MODAL -----
function showModal(message, { title = 'Aviso', onAccept = null } = {}) {
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const messageEl = document.getElementById('modalMessage');
  const acceptBtn = document.getElementById('modalAcceptBtn');
  const closeBtn = document.getElementById('modalCloseBtn');

  titleEl.textContent = title;
  messageEl.textContent = message;
  overlay.classList.add('active');

  const cleanup = () => {
    overlay.classList.remove('active');
    acceptBtn.removeEventListener('click', handleAccept);
    closeBtn.removeEventListener('click', handleClose);
    overlay.removeEventListener('click', handleOverlayClick);
  };

  const handleAccept = () => {
    cleanup();
    if (onAccept) onAccept();
  };

  const handleClose = () => cleanup();

  const handleOverlayClick = (e) => {
    if (e.target === overlay) cleanup();
  };

  acceptBtn.addEventListener('click', handleAccept);
  closeBtn.addEventListener('click', handleClose);
  overlay.addEventListener('click', handleOverlayClick);
}

// ----- REGISTRO -----
const tieneUsername = document.getElementById('username');
const formRegistro = tieneUsername ? document.getElementById('registro') : null;

if (formRegistro) {
  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data)
          ? data.map(d => d).join('\n')
          : data.message;
        showModal(msg || 'Error al registrarse', { title: 'Error' });
        return;
      }

      showModal('Cuenta creada con éxito', {
        title: 'Éxito',
        onAccept: () => { window.location.href = 'login.html'; }
      });
    } catch (err) {
      console.error(err);
      showModal('No se pudo conectar con el servidor', { title: 'Error' });
    }
  });
}

// ----- LOGIN -----
const formLogin = !tieneUsername ? document.getElementById('registro') : null;

if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showModal(data.message || 'Credenciales incorrectas', { title: 'Error' });
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      showModal('No se pudo conectar con el servidor', { title: 'Error' });
    }
  });
}