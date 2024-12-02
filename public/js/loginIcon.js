// document.addEventListener('DOMContentLoaded', async function () {
//     const btnToggle = document.getElementById('btnToggle');
//     const btnText = document.getElementById('btnText');
//     const btnIcon = document.getElementById('btnIcon');
    
//     // Function to update button based on login state
//     function updateButton(loggedIn) {
//         if (loggedIn) {
//             btnText.textContent = 'Logout';
//             btnIcon.classList.remove('fa-user');
//             btnIcon.classList.add('fa-sign-out-alt');
//         } else {
//             btnText.textContent = 'Login';
//             btnIcon.classList.remove('fa-sign-out-alt');
//             btnIcon.classList.add('fa-user');
//         }
//     }

//     // Fetch login state from the server
//     async function fetchLoginState() {
//         try {
//             const response = await fetch('/api/check-login');
//             const data = await response.json();
//             updateButton(data.loggedIn);
//         } catch (error) {
//             console.error('Error fetching login state:', error);
//         }
//     }

//     // Handle button click
//     btnToggle.addEventListener('click', async function (e) {
//         e.preventDefault();

//         if (btnText.textContent === 'Logout') {
//             try {
//                 const response = await fetch('/api/logout', {
//                     method: 'POST'
//                 });
//                 const data = await response.json();
//                 if (data.success) {
//                     // Update button and redirect
//                     updateButton(false);
//                     window.location.href = '/login'; 
//                 }
//             } catch (error) {
//                 console.error('Error during logout:', error);
//             }
//         } else {
//             window.location.href = '/login'; 
//         }
//     });

//     // Initial button update
//     fetchLoginState();
// });
