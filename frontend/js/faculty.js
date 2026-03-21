document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    if (!user || !['faculty', 'hod'].includes(user.role)) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = `${user.name} (${user.role.toUpperCase()})`;
    loadPendingRequests();
});

function formatDate(dateString) {
    if(!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

async function loadPendingRequests() {
    const tbody = document.getElementById('pendingRequestsTable');
    try {
        const data = await apiFetch('/leave');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No pending requests! 🎉</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(leave => `
            <tr>
                <td><strong>${leave.student_name}</strong></td>
                <td>${leave.type}</td>
                <td>${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}</td>
                <td><div style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${leave.reason}">${leave.reason}</div></td>
                <td>
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-success" onclick="reviewRequest(${leave.id}, 'approved')">Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="reviewRequest(${leave.id}, 'rejected')">Reject</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load: ${err.message}</td></tr>`;
    }
}

async function reviewRequest(id, decision) {
    const actionLabel = decision === 'approved' ? 'approve' : 'reject';
    const comment = prompt(`Are you sure you want to ${actionLabel} this request?\nOptional comment:`);
    
    // If prompt cancelled, it returns null
    if (comment === null) return;

    try {
        await apiFetch(`/leave/${id}/review`, {
            method: 'PUT',
            body: JSON.stringify({ decision, comment })
        });
        
        loadPendingRequests(); // Refresh table
    } catch (err) {
        alert(`Failed to ${actionLabel}: ${err.message}`);
    }
}
