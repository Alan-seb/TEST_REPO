document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect based on role
    const user = getUser();
    if (user) {
        redirectRole(user.role);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const alertEl = document.getElementById('loginAlert');
            
            try {
                // we don't use apiFetch yet because it needs token, though it could work
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                redirectRole(data.user.role);
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            }
        });
    }
});

function redirectRole(role) {
    if (role === 'student') window.location.href = 'student.html';
    else if (role === 'faculty' || role === 'hod') window.location.href = 'faculty.html';
    else if (role === 'admin') window.location.href = 'admin.html';
}
