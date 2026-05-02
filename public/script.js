const API = "http://localhost:3000";

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const data = {
            fullname: document.getElementById("fullname").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        };

        const response = await fetch(`${API}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message);

        if (result.success) {
            window.location.href = "login.html";
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const data = {
            email: document.getElementById("loginEmail").value,
            password: document.getElementById("loginPassword").value
        };

        const response = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem("user", JSON.stringify(result.user));

            if (result.user.role === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "dashboard.html";
            }
        } else {
            alert(result.message);
        }
    });
}

const orderForm = document.getElementById("orderForm");

if (orderForm) {
    orderForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const user = JSON.parse(localStorage.getItem("user"));

        const data = {
            user_id: user.id,
            service_type: document.getElementById("service_type").value,
            weight: document.getElementById("weight").value,
            pickup_date: document.getElementById("pickup_date").value
        };

        const response = await fetch(`${API}/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message);
    });
}

async function loadOrders() {
    const response = await fetch(`${API}/orders`);
    const orders = await response.json();

    const table = document.getElementById("ordersTable");
    table.innerHTML = "";

    orders.forEach(order => {
        table.innerHTML += `
            <tr>
                <td>${order.fullname}</td>
                <td>${order.service_type}</td>
                <td>${order.weight} kg</td>
                <td>${new Date(order.pickup_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })}</td>
                <td>₱${order.total_amount}</td>
                <td>${order.status}</td>
                <td>
                    ${
                        order.payment_status === "Paid"
                        ? `<span class="paid">Paid</span>`
                        : `<span class="unpaid">Unpaid</span>`
                    }
                </td>
                <td>${order.payment_method || "Not Paid"}</td>
                <td>
                    <select onchange="updateStatus(${order.id}, this.value)">
                        <option value="Pending">Pending</option>
                        <option value="Washing">Washing</option>
                        <option value="Drying">Drying</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Completed">Completed</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

async function updateStatus(id, status) {
    await fetch(`${API}/update-status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    });

    alert("Status updated");
    loadOrders();
}
async function loadMyOrders() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const response = await fetch(`${API}/my-orders/${user.id}`);
    const orders = await response.json();

    const table = document.getElementById("myOrdersTable");
    table.innerHTML = "";

    orders.forEach(order => {
        table.innerHTML += `
            <tr>
                <td>${order.service_type}</td>
                <td>${order.weight} kg</td>
                <td>${new Date(order.pickup_date).toLocaleDateString()}</td>
                <td>₱${order.total_amount}</td>
                <td>${order.status}</td>
                <td>
                    ${
                        order.payment_status === "Paid"
                        ? `<button class="print-btn" onclick="printReceipt('${order.service_type}', '${order.weight}', '${order.pickup_date}', '${order.total_amount}', '${order.status}', '${order.payment_method}')">
                            🧾 Print
                            </button>`
                        : `<button class="pay-btn" onclick="payOrder(${order.id})">
                            💳 Pay Now
                            </button>`
                    }
                </td>
            </tr>
        `;
    });
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}
let selectedOrderId = null;

function payOrder(id) {
    selectedOrderId = id;
    document.getElementById("paymentModal").style.display = "flex";
}

function closePaymentModal() {
    document.getElementById("paymentModal").style.display = "none";
}

async function confirmPayment() {
    const paymentMethod = document.getElementById("paymentMethod").value;

    const response = await fetch(`${API}/pay-order/${selectedOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: paymentMethod })
    });

    const result = await response.json();
    alert(result.message);

    if (result.success) {
        closePaymentModal();
        loadMyOrders();
    }
}
function printReceipt(service, weight, pickupDate, total, status, paymentMethod) {
    const user = JSON.parse(localStorage.getItem("user"));

    const receiptWindow = window.open("", "_blank");

    receiptWindow.document.write(`
        <html>
        <head>
            <title>Washmate Receipt</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    background: #f4f9ff;
                }

                .receipt {
                    background: white;
                    width: 400px;
                    margin: auto;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                }

                h2 {
                    text-align: center;
                    color: #0878d1;
                }

                p {
                    font-size: 16px;
                    line-height: 1.6;
                }

                .total {
                    font-size: 20px;
                    font-weight: bold;
                    color: #0878d1;
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }

                .thanks {
                    text-align: center;
                    margin-top: 25px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <h2>Washmate Receipt</h2>

                <p><strong>Customer:</strong> ${user.fullname}</p>
                <p><strong>Service:</strong> ${service}</p>
                <p><strong>Weight:</strong> ${weight} kg</p>
                <p><strong>Pickup Date:</strong> ${new Date(pickupDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })}</p>
                <p><strong>Order Status:</strong> ${status}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                <p><strong>Payment Status:</strong> Paid</p>

                <p class="total">Total Amount: ₱${total}</p>

                <p class="thanks">Thank you for using Washmate!</p>
            </div>

            <script>
                window.print();
            </script>
        </body>
        </html>
    `);

    receiptWindow.document.close();
}

// Disable past dates on the date picker
const dateInput = document.getElementById("pickupDate");

// Get current date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];

// Set the min attribute to today's date
dateInput.setAttribute("min", today);

const data = {
    user_id: user.id,
    service_type: document.getElementById("service_type").value,
    weight: document.getElementById("weight").value,
    pickup_date: document.getElementById("pickup_date").value
};
document.addEventListener("DOMContentLoaded", function () {
    const pickup_date = document.getElementById("pickup_date");

    if (!pickupDate) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const todayDate = `${yyyy}-${mm}-${dd}`;

    pickupDate.min = todayDate;

    pickupDate.addEventListener("input", function () {
        if (pickupDate.value < todayDate) {
            alert("Past dates are not allowed.");
            pickupDate.value = "";
        }
    });
});