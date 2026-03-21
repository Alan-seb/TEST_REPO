document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = user.name;
    loadLeaveHistory();

    document.getElementById('applyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = document.getElementById('type').value;
        const start_date = document.getElementById('startDate').value;
        const end_date = document.getElementById('endDate').value;
        const reason = document.getElementById('reason').value;
        const alertEl = document.getElementById('applyAlert');

        try {
            await apiFetch('/leave', {
                method: 'POST',
                body: JSON.stringify({ type, start_date, end_date, reason })
            });
            
            toggleForm();
            document.getElementById('applyForm').reset();
            loadLeaveHistory();
        } catch (err) {
            alertEl.textContent = err.message;
            alertEl.style.display = 'block';
        }
    });
});

function toggleForm() {
    const card = document.getElementById('applyFormCard');
    card.classList.toggle('hidden');
    document.getElementById('applyAlert').style.display = 'none';
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

async function loadLeaveHistory() {
    const tbody = document.getElementById('leaveHistoryTable');
    try {
        const data = await apiFetch('/leave');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No applications found.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(leave => `
            <tr>
                <td><strong>${leave.type}</strong></td>
                <td>${formatDate(leave.start_date)} to ${formatDate(leave.end_date)}</td>
                <td><div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${leave.reason}">${leave.reason}</div></td>
                <td>${formatStatus(leave.status)}</td>
                <td>${formatDate(leave.created_at)}</td>
                <td>
                    ${leave.status === 'pending_faculty' ? `<button class="btn btn-sm btn-danger" onclick="deleteLeave(${leave.id})">Delete</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load: ${err.message}</td></tr>`;
    }
}

async function deleteLeave(id) {
    if (!confirm('Are you sure you want to delete this leave application?')) return;
    
    try {
        await apiFetch(`/leave/${id}`, { method: 'DELETE' });
        loadLeaveHistory();
    } catch (err) {
        alert('Failed to delete: ' + err.message);
    }
}
