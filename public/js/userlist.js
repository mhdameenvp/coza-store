let blockAndUnblock = async (email, BlockedOrNot) => {
    console.log(email);
    if (BlockedOrNot === "false") {
        try {
            let response = await swal.fire({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: 'brown',
                confirmButtonText: 'Yes, I am sure!',
                cancelButtonText: "No, cancel it!",
                closeOnConfirm: false,
                closeOnCancel: false
            })
            if (!response.isConfirmed) {
                e.preventDefault();
            } else {
                console.log("unblock")
                let respon = await fetch(`http://localhost:2020/admin/blockUser?email=${email}`, {
                    method: "PATCH"
                });
                if (respon.ok) {
                    let responseData = await respon.json();
                    document.getElementById("messageDiv").innerText = responseData.message;
                    $('#tablePagination').load('/admin/userslist #tablePagination')
                } else {
                    console.error('Failed to block user. Status:', response.status);
                }
            }

        } catch (error) {
            console.log("Blocking error", error);
        }
    } else {
        try {
            let response = await swal.fire({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: 'brown',
                confirmButtonText: 'Yes, I am sure!',
                cancelButtonText: "No, cancel it!",
                closeOnConfirm: false,
                closeOnCancel: false
            })
            if (!response.isConfirmed) {
                e.preventDefault();
            }else{
                console.log("unblock")
                let respon= await fetch(`http://localhost:2020/admin/unBlockUser?email=${email}`, {
                    method: "PATCH"
                });
                if (respon.ok) {
                    let responseData = await respon.json();
                    document.getElementById("messageDiv").innerText = responseData.message;
                    $('#tablePagination').load('/admin/userslist #tablePagination')
                } else {
                    console.error('Failed to unblock user. Status:', response.status);
                }
            }
            
        } catch (error) {
            console.log("Unblocking error", error);
        }
    }
}
$(document).ready(function () {
    "use strict";
        // Animate loader off screen
        setTimeout(function(){ $('.preloader').fadeOut('slow'); }, 1000);
    });