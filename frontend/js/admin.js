document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = `${user.name} (Admin)`;
    
    loadAllRequests();
    loadUsers();

    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('newName').value;
        const email = document.getElementById('newEmail').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        try {
            await apiFetch('/users', {
                method: 'POST',
                body: JSON.stringify({ name, email, password, role })
            });
            
            toggleUserForm();
            document.getElementById('addUserForm').reset();
            loadUsers();
            alert('User created successfully');
        } catch (err) {
            alert('Failed to create user: ' + err.message);
        }
    });
});

function toggleUserForm() {
    const el = document.getElementById('addUserFormContainer');
    el.classList.toggle('hidden');
}

function formatStatus(status) {
    const map = {
        'pending_faculty': 'Pending Faculty',
        'pending_hod': 'Pending HOD',
        'pending_admin': 'Pending Admin',
        'approved': 'Approved',
        'rejected': 'Rejected'
    };
    return `<span class="badge badge-${status}">${map[status] || status}</span>`;
}

function formatDate(dateString) {
    if(!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

async function loadAllRequests() {
    const tbody = document.getElementById('allRequestsTable');
    try {
        const data = await apiFetch('/leave');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No requests found.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(leave => `
            <tr>
                <td><strong>${leave.student_name}</strong></td>
                <td>${leave.type}</td>
                <td>${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}</td>
                <td><div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${leave.reason}">${leave.reason}</div></td>
                <td>${formatStatus(leave.status)}</td>
                <td>
                    ${leave.status === 'pending_admin' ? `
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-success" onclick="reviewRequest(${leave.id}, 'approved')">Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="reviewRequest(${leave.id}, 'rejected')">Reject</button>
                    </div>
                    ` : '<span class="text-muted" style="font-size:0.875rem">No action needed</span>'}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load: ${err.message}</td></tr>`;
    }
}

async function reviewRequest(id, decision) {
    const actionLabel = decision === 'approved' ? 'approve' : 'reject';
    const comment = prompt(`Are you sure you want to ${actionLabel} this request?\nOptional comment:`);
    
    if (comment === null) return;

    try {
        await apiFetch(`/leave/${id}/review`, {
            method: 'PUT',
            body: JSON.stringify({ decision, comment })
        });
        loadAllRequests();
    } catch (err) {
        alert(`Failed to ${actionLabel}: ${err.message}`);
    }
}

async function loadUsers() {
    const tbody = document.getElementById('usersTable');
    try {
        const data = await apiFetch('/users');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No users found.</td></tr>';
            return;
        }

        const user = getUser();
        tbody.innerHTML = data.map(u => `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span style="text-transform: capitalize; font-weight: 500">${u.role}</span></td>
                <td>${formatDate(u.created_at)}</td>
                <td>
                    ${u.id === user.id ? 
                        '<span class="text-muted" style="font-size:0.875rem">Current User</span>' : 
                        `<button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">Delete</button>`
                    }
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load: ${err.message}</td></tr>`;
    }
}

async function deleteUser(id) {
    if(!confirm('Are you sure you want to delete this user? This is permanent.')) return;
    
    try {
        await apiFetch(`/users/${id}`, { method: 'DELETE' });
        loadUsers();
    } catch (err) {
        alert(`Failed to delete user: ${err.message}`);
    }
}
