const API_BASE = 'https://todo-app-1-w0o2.onrender.com/api/auth'; // حدّث برابطك الفعلي

const alertBox = document.getElementById('alert-box');
const showAlert = (message, type = 'error') => {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
};

// ==== عرض رسالة نتيجة التفعيل عند الرجوع من الإيميل ====
const params = new URLSearchParams(window.location.search);
if (params.get('verified') === 'success') showAlert('تم تفعيل حسابك بنجاح — سجل دخولك الآن', 'success');
if (params.get('verified') === 'fail') showAlert('رابط التفعيل غير صالح أو منتهي');

// ==== تسجيل الدخول ====
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.disabled = true; btn.textContent = 'جاري الدخول...';

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('login-email').value.trim(),
          password: document.getElementById('login-password').value,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        showAlert(data.message);
        btn.disabled = false; btn.textContent = 'دخول';
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user.name);
      window.location.href = 'index.html';
    } catch (err) {
      showAlert('حدث خطأ — تأكد من اتصالك بالإنترنت');
      btn.disabled = false; btn.textContent = 'دخول';
    }
  });
}

// ==== إنشاء حساب ====
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    btn.disabled = true; btn.textContent = 'جاري الإنشاء...';

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('reg-name').value.trim(),
          email: document.getElementById('reg-email').value.trim(),
          password: document.getElementById('reg-password').value,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        showAlert(data.message);
        btn.disabled = false; btn.textContent = 'إنشاء الحساب';
        return;
      }

      showAlert('تم إنشاء الحساب! افتح إيميلك واضغط رابط التفعيل قبل ما تسجل دخول.', 'success');
      registerForm.reset();
      btn.textContent = 'تم الإرسال ✓';
    } catch (err) {
      showAlert('حدث خطأ — تأكد من اتصالك بالإنترنت');
      btn.disabled = false; btn.textContent = 'إنشاء الحساب';
    }
  });
}