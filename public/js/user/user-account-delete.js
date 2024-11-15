document.getElementById('deactivateAccount').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Deactivate account clicked');
});

document.getElementById('deleteAccount').addEventListener('click', function(e) {
    e.preventDefault();
    const userId = '<%= userId %>';

    Swal.fire({
        title: 'Are you sure?',
        text: "If you press confirm, your profile information and address will be deleted. This action cannot be reverted!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteAccount(userId);
        }
    });
});

async function deleteAccount(userId) { 
    try {
        const response = await fetch('/user/delete-account', { 
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        if (response.ok && data.status === true) {
            Swal.fire(
                'Deleted!',
                'Your profile information has been deleted.',
                'success'
            ).then(() => {
                location.href = '/signup'; 
            });
        } else {
            Swal.fire('Failed', data.message || 'Deleting account failed', 'error');
        }
    } catch (error) {
        Swal.fire(
            'Error',
            'An error occurred while deleting the account',
            'error'
        );
        console.error('Error deleting account', error);
    }
}