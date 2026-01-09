// Phase 2 & 3: Client-Side Routing + Authentication

// ==============================
// Global state & "database"
// ==============================

// Global "logged in user" placeholder
// null = not authenticated
// when logged in: { firstName, lastName, email, role }
let currentUser = null;

// Phase 4 storage key
const STORAGE_KEY = 'ipt_demo_v1';

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            // Seed initial data
            const seeded = {
                accounts: [
                    {
                        id: 1,
                        firstName: 'Admin',
                        lastName: 'User',
                        email: 'admin@example.com',
                        password: 'password123',
                        verified: true,
                        role: 'admin'
                    }
                ],
                departments: [
                    { id: 1, name: 'Engineering', description: 'Engineering department' },
                    { id: 2, name: 'HR', description: 'Human Resources' }
                ],
                employees: [],
                requests: []
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
            return seeded;
        }

        const parsed = JSON.parse(raw);
        if (!parsed.accounts) parsed.accounts = [];
        if (!parsed.departments) parsed.departments = [];
        if (!parsed.employees) parsed.employees = [];
        if (!parsed.requests) parsed.requests = [];
        return parsed;
    } catch (e) {
        console.error('Failed to load DB, seeding fresh data.', e);
        const fallback = {
            accounts: [],
            departments: [],
            employees: [],
            requests: []
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        return fallback;
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}


window.db = loadFromStorage();



function setAuthState(isAuth, user) {
    if (isAuth && user) {
        currentUser = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role || 'user'
        };
    } else {
        currentUser = null;
    }

    updateAuthClasses();

    if (currentUser) {
        renderProfile();
    }
}

function navigateTo(hash) {
   
    if (!hash.startsWith('#')) {
        hash = '#/' + hash.replace(/^\/+/, '');
    }
    window.location.hash = hash;
}

function updateAuthClasses() {
    const body = document.body;
    const isAuthenticated = !!currentUser;
    const isAdmin = isAuthenticated && currentUser.role === 'admin';

    if (!isAuthenticated) {
        body.classList.add('not-authenticated');
        body.classList.remove('authenticated', 'is-admin');
    } else {
        body.classList.add('authenticated');
        body.classList.remove('not-authenticated');

        if (isAdmin) {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
    }

 
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        if (isAuthenticated) {
            // Set label text based on role
            if (isAdmin) {
                userDropdown.textContent = 'Admin';
            } else {
                const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
                const fallback = (currentUser.email || '').split('@')[0] || 'User';
                userDropdown.textContent = fullName || fallback;
            }
            userDropdown.classList.remove('d-none');
        } else {
            userDropdown.textContent = 'Username';
            userDropdown.classList.add('d-none');
        }
    }
}

function handleRouting() {
   
    let hash = window.location.hash || '#/';
    let route = hash.replace(/^#\/?/, ''); // "" or "login"

    if (route === '') {
        route = 'home';
    }

    const protectedRoutes = ['profile', 'requests', 'employees', 'departments', 'accounts'];
    const adminRoutes = ['employees', 'departments', 'accounts'];

    const isAuthenticated = !!currentUser;
    const isAdmin = isAuthenticated && currentUser.role === 'admin';

   
    if (!isAuthenticated && protectedRoutes.includes(route)) {
        navigateTo('#/login');
        return;
    }

  
    if (isAuthenticated && !isAdmin && adminRoutes.includes(route)) {
        navigateTo('#/');
        return;
    }

  
    updateAuthClasses();

   
    const routesConfig = {
        'home': 'home',
        '/': 'home',
        'login': 'login',
        'register': 'register',
        'verify-email': 'verify-email',
        'profile': 'profile',
        'employees': 'employees',
        'departments': 'departments',
        'accounts': 'accounts',
        'requests': 'requests'
    };

    const targetId = routesConfig[route] || 'home';

   
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

   
    const targetPage = document.getElementById(targetId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        const homePage = document.getElementById('home');
        if (homePage) {
            homePage.classList.add('active');
        }
    }

    
    if (targetId === 'profile') {
        renderProfile();
    } else if (targetId === 'accounts') {
        renderAccountsList();
    } else if (targetId === 'departments') {
        renderDepartmentsTable();
    } else if (targetId === 'employees') {
        renderEmployeesTable();
    } else if (targetId === 'requests') {
        renderRequestsList();
    }
}



function renderProfile() {
    if (!currentUser) return;

    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const roleEl = document.getElementById('profile-role');

    if (nameEl) {
        nameEl.textContent = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    }
    if (emailEl) {
        emailEl.textContent = currentUser.email || '';
    }
    if (roleEl) {
        roleEl.textContent = currentUser.role || 'user';
    }
}


function renderAccountsList() {
    const tbody = document.getElementById('accounts-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    window.db.accounts.forEach((acc) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>${acc.role || 'user'}</td>
            <td>${acc.verified ? 'Yes' : '—'}</td>
            <td>
                <button class="btn btn-sm btn-secondary me-1" data-action="edit" data-id="${acc.id}">Edit</button>
                <button class="btn btn-sm btn-warning me-1" data-action="reset" data-id="${acc.id}">Reset PW</button>
                <button class="btn btn-sm btn-danger" data-action="delete" data-id="${acc.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderDepartmentsTable() {
    const tbody = document.getElementById('departments-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    window.db.departments.forEach((dept) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dept.name}</td>
            <td>${dept.description || ''}</td>
            <td>
                <button class="btn btn-sm btn-secondary me-1" data-action="edit" data-id="${dept.id}">Edit</button>
                <button class="btn btn-sm btn-danger" data-action="delete" data-id="${dept.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEmployeesTable() {
    const tbody = document.getElementById('employees-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    window.db.employees.forEach((emp) => {
        const user = window.db.accounts.find((a) => a.id === emp.accountId);
        const dept = window.db.departments.find((d) => d.id === emp.departmentId);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.employeeId}</td>
            <td>${user ? user.email : emp.userEmail}</td>
            <td>${emp.position || ''}</td>
            <td>${dept ? dept.name : ''}</td>
            <td>
                <button class="btn btn-sm btn-secondary me-1" data-action="edit" data-id="${emp.id}" disabled>Edit</button>
                <button class="btn btn-sm btn-danger" data-action="delete" data-id="${emp.id}" disabled>Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}



function renderRequestsList() {
    const tbody = document.getElementById('requests-tbody');
    if (!tbody || !currentUser) return;

    tbody.innerHTML = '';

    const myRequests = window.db.requests.filter(
        (req) => req.employeeEmail === currentUser.email
    );

    myRequests.forEach((req) => {
        const tr = document.createElement('tr');
        const statusClass =
            req.status === 'Approved'
                ? 'badge bg-success'
                : req.status === 'Rejected'
                ? 'badge bg-danger'
                : 'badge bg-warning text-dark';

        tr.innerHTML = `
            <td>${req.date || ''}</td>
            <td>${req.type}</td>
            <td>${req.items.map((i) => `${i.name} (${i.qty})`).join(', ')}</td>
            <td><span class="${statusClass}">${req.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}



function setupAccountsAdmin() {
    const tbody = document.getElementById('accounts-tbody');
    const addBtn = document.getElementById('add-account-btn');
    const panel = document.getElementById('account-form-panel');
    const form = document.getElementById('account-form');
    const errorEl = document.getElementById('account-error');
    const titleEl = document.getElementById('account-form-title');

    if (!tbody || !addBtn || !panel || !form) return;

    addBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('accountId').value = '';
        if (titleEl) titleEl.textContent = 'Add Account';
        panel.classList.remove('d-none');
    });

    tbody.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        const id = target.dataset.id ? Number(target.dataset.id) : null;
        if (!action || !id) return;

        const account = window.db.accounts.find((a) => a.id === id);
        if (!account) return;

        if (action === 'edit') {
            if (titleEl) titleEl.textContent = 'Edit Account';
            panel.classList.remove('d-none');
            document.getElementById('accountId').value = account.id;
            document.getElementById('accountFirstName').value = account.firstName || '';
            document.getElementById('accountLastName').value = account.lastName || '';
            document.getElementById('accountEmail').value = account.email || '';
            document.getElementById('accountPassword').value = account.password || '';
            document.getElementById('accountRole').value = account.role || 'user';
            document.getElementById('accountVerified').checked = !!account.verified;
        } else if (action === 'reset') {
            const newPw = prompt('Enter new password (min 6 chars):', '');
            if (!newPw || newPw.length < 6) {
                alert('Password must be at least 6 characters.');
                return;
            }
            account.password = newPw;
            saveToStorage();
            alert('Password updated.');
        } else if (action === 'delete') {
            if (currentUser && currentUser.email === account.email) {
                alert('You cannot delete your own account.');
                return;
            }
            if (confirm('Delete this account?')) {
                window.db.accounts = window.db.accounts.filter((a) => a.id !== id);
                saveToStorage();
                renderAccountsList();
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (errorEl) errorEl.textContent = '';

        const formData = new FormData(form);
        const idRaw = formData.get('id')?.toString();
        const firstName = formData.get('firstName')?.toString().trim() || '';
        const lastName = formData.get('lastName')?.toString().trim() || '';
        const email = formData.get('email')?.toString().trim().toLowerCase() || '';
        const password = formData.get('password')?.toString() || '';
        const role = formData.get('role')?.toString() || 'user';
        const verified = formData.get('verified') === 'on';

        if (password.length < 6) {
            if (errorEl) errorEl.textContent = 'Password must be at least 6 characters.';
            return;
        }

        const existingByEmail = window.db.accounts.find(
            (a) => a.email.toLowerCase() === email && a.id.toString() !== (idRaw || '')
        );
        if (existingByEmail) {
            if (errorEl) errorEl.textContent = 'Email is already in use.';
            return;
        }

        if (idRaw) {
            const id = Number(idRaw);
            const acc = window.db.accounts.find((a) => a.id === id);
            if (!acc) return;
            acc.firstName = firstName;
            acc.lastName = lastName;
            acc.email = email;
            acc.password = password;
            acc.role = role;
            acc.verified = verified;
        } else {
            const newAccount = {
                id: Date.now(),
                firstName,
                lastName,
                email,
                password,
                role,
                verified
            };
            window.db.accounts.push(newAccount);
        }

        saveToStorage();
        renderAccountsList();
        panel.classList.add('d-none');
        form.reset();
    });
}

function setupDepartmentsAdmin() {
    const addBtn = document.getElementById('add-department-btn');
    const panel = document.getElementById('department-form-panel');
    const form = document.getElementById('department-form');
    const errorEl = document.getElementById('department-error');
    const titleEl = document.getElementById('department-form-title');
    const tbody = document.getElementById('departments-tbody');

    if (!addBtn || !panel || !form || !tbody) return;

    addBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('departmentId').value = '';
        if (titleEl) titleEl.textContent = 'Add Department';
        if (errorEl) errorEl.textContent = '';
        panel.classList.remove('d-none');
    });

    tbody.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        const id = target.dataset.id ? Number(target.dataset.id) : null;
        if (!action || !id) return;

        const dept = window.db.departments.find((d) => d.id === id);
        if (!dept) return;

        if (action === 'edit') {
            if (titleEl) titleEl.textContent = 'Edit Department';
            document.getElementById('departmentId').value = String(dept.id);
            document.getElementById('departmentName').value = dept.name || '';
            document.getElementById('departmentDescription').value = dept.description || '';
            if (errorEl) errorEl.textContent = '';
            panel.classList.remove('d-none');
        } else if (action === 'delete') {
            if (confirm('Delete this department?')) {
                window.db.departments = window.db.departments.filter((d) => d.id !== id);
                // Also detach from employees
                window.db.employees = window.db.employees.filter((e) => e.departmentId !== id);
                saveToStorage();
                renderDepartmentsTable();
                renderEmployeesTable();
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (errorEl) errorEl.textContent = '';

        const formData = new FormData(form);
        const idRaw = formData.get('id')?.toString();
        const name = formData.get('name')?.toString().trim() || '';
        const description = formData.get('description')?.toString().trim() || '';

        if (!name) {
            if (errorEl) errorEl.textContent = 'Department name is required.';
            return;
        }

        const existsByName = window.db.departments.find(
            (d) => d.name.toLowerCase() === name.toLowerCase() && d.id.toString() !== (idRaw || '')
        );
        if (existsByName) {
            if (errorEl) errorEl.textContent = 'A department with that name already exists.';
            return;
        }

        if (idRaw) {
            const id = Number(idRaw);
            const dept = window.db.departments.find((d) => d.id === id);
            if (!dept) return;
            dept.name = name;
            dept.description = description;
        } else {
            const newDept = {
                id: Date.now(),
                name,
                description
            };
            window.db.departments.push(newDept);
        }

        saveToStorage();
        renderDepartmentsTable();
        panel.classList.add('d-none');
        form.reset();
    });
}

function setupEmployeesAdmin() {
    const addBtn = document.getElementById('add-employee-btn');
    const panel = document.getElementById('employee-form-panel');
    const form = document.getElementById('employee-form');
    const deptSelect = document.getElementById('employeeDept');
    const errorEl = document.getElementById('employee-error');

    if (!addBtn || !panel || !form || !deptSelect) return;

    function populateDepartments() {
        deptSelect.innerHTML = '';
        window.db.departments.forEach((dept) => {
            const opt = document.createElement('option');
            opt.value = String(dept.id);
            opt.textContent = dept.name;
            deptSelect.appendChild(opt);
        });
    }

    addBtn.addEventListener('click', () => {
        populateDepartments();
        form.reset();
        panel.classList.remove('d-none');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (errorEl) errorEl.textContent = '';

        const formData = new FormData(form);
        const employeeId = formData.get('employeeId')?.toString().trim() || '';
        const email = formData.get('email')?.toString().trim().toLowerCase() || '';
        const position = formData.get('position')?.toString().trim() || '';
        const departmentId = Number(formData.get('departmentId'));
        const hireDate = formData.get('hireDate')?.toString() || '';

        // Validate employeeId: exactly 8 digits
        if (!/^\d{8}$/.test(employeeId)) {
            if (errorEl) errorEl.textContent = 'Employee ID must be exactly 8 digits.';
            return;
        }

        const account = window.db.accounts.find(
            (a) => a.email.toLowerCase() === email
        );
        if (!account) {
            if (errorEl) errorEl.textContent = 'User email must match an existing account.';
            return;
        }

        const dept = window.db.departments.find((d) => d.id === departmentId);
        if (!dept) {
            if (errorEl) errorEl.textContent = 'Please select a valid department.';
            return;
        }

        const newEmployee = {
            id: Date.now(),
            employeeId,
            accountId: account.id,
            userEmail: account.email,
            position,
            departmentId,
            hireDate
        };

        window.db.employees.push(newEmployee);
        saveToStorage();
        renderEmployeesTable();
        panel.classList.add('d-none');
        form.reset();
    });
}

function setupRequests() {
    const addBtn = document.getElementById('add-request-btn');
    const panel = document.getElementById('request-form-panel');
    const form = document.getElementById('request-form');
    const itemsContainer = document.getElementById('request-items-container');
    const addItemBtn = document.getElementById('add-request-item-btn');
    const errorEl = document.getElementById('request-error');

    if (!addBtn || !panel || !form || !itemsContainer || !addItemBtn) return;

    function addItemRow() {
        const row = document.createElement('div');
        row.className = 'row g-2 align-items-center mb-2 request-item-row';
        row.innerHTML = `
            <div class="col-7">
                <input type="text" class="form-control request-item-name" placeholder="Item name" required>
            </div>
            <div class="col-3">
                <input type="number" class="form-control request-item-qty" placeholder="Qty" min="1" value="1" required>
            </div>
            <div class="col-2 text-end">
                <button type="button" class="btn btn-sm btn-outline-danger remove-request-item-btn">×</button>
            </div>
        `;
        itemsContainer.appendChild(row);
    }

    addBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert('You must be logged in to create a request.');
            return;
        }
        itemsContainer.innerHTML = '';
        addItemRow();
        if (errorEl) errorEl.textContent = '';
        panel.classList.remove('d-none');
    });

    addItemBtn.addEventListener('click', () => {
        addItemRow();
    });

    itemsContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.classList.contains('remove-request-item-btn')) {
            const row = target.closest('.request-item-row');
            if (row) {
                row.remove();
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('You must be logged in to submit a request.');
            return;
        }
        if (errorEl) errorEl.textContent = '';

        const typeSelect = document.getElementById('requestType');
        const type = typeSelect ? typeSelect.value : 'Equipment';

        const itemRows = itemsContainer.querySelectorAll('.request-item-row');
        const items = [];
        itemRows.forEach((row) => {
            const nameInput = row.querySelector('.request-item-name');
            const qtyInput = row.querySelector('.request-item-qty');
            const name = nameInput && nameInput.value.trim();
            const qtyVal = qtyInput && qtyInput.value;
            const qty = qtyVal ? Number(qtyVal) : 0;
            if (name && qty > 0) {
                items.push({ name, qty });
            }
        });

        if (items.length === 0) {
            if (errorEl) errorEl.textContent = 'Please add at least one item.';
            return;
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        const newRequest = {
            id: Date.now(),
            type,
            items,
            status: 'Pending',
            date: dateStr,
            employeeEmail: currentUser.email
        };

        window.db.requests.push(newRequest);
        saveToStorage();
        renderRequestsList();
        panel.classList.add('d-none');
        form.reset();
        itemsContainer.innerHTML = '';
    });
}

// ==============================
// Phase 3: Auth forms & events
// ==============================

function setupAuthForms() {
    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (registerError) registerError.textContent = '';

            const formData = new FormData(registerForm);
            const firstName = formData.get('firstName')?.toString().trim() || '';
            const lastName = formData.get('lastName')?.toString().trim() || '';
            const email = formData.get('email')?.toString().trim().toLowerCase() || '';
            const password = formData.get('password')?.toString() || '';

            if (password.length < 6) {
                if (registerError) registerError.textContent = 'Password must be at least 6 characters.';
                return;
            }

            const existing = window.db.accounts.find(
                (acc) => acc.email.toLowerCase() === email
            );
            if (existing) {
                if (registerError) registerError.textContent = 'An account with that email already exists.';
                return;
            }

            const newAccount = {
                id: Date.now(),
                firstName,
                lastName,
                email,
                password,
                verified: false,
                role: 'user'
            };

            window.db.accounts.push(newAccount);
            saveToStorage();

            localStorage.setItem('unverified_email', email);

            navigateTo('#/verify-email');
        });
    }

   
    const simulateBtn = document.getElementById('simulate-verify-btn');

    if (simulateBtn) {
        simulateBtn.addEventListener('click', () => {
            const email = localStorage.getItem('unverified_email');
            if (!email) return;

            const account = window.db.accounts.find(
                (acc) => acc.email.toLowerCase() === email.toLowerCase()
            );
            if (account) {
                account.verified = true;
                saveToStorage();
            }

            // Clear temp email and go to login
            localStorage.removeItem('unverified_email');
            navigateTo('#/login');
        });
    }

    
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (loginError) loginError.textContent = '';

            const formData = new FormData(loginForm);
            const email = formData.get('email')?.toString().trim().toLowerCase() || '';
            const password = formData.get('password')?.toString() || '';

            const account = window.db.accounts.find(
                (acc) =>
                    acc.email.toLowerCase() === email &&
                    acc.password === password &&
                    acc.verified === true
            );

            if (!account) {
                if (loginError) loginError.textContent = 'Invalid credentials or email not verified.';
                return;
            }

            
            localStorage.setItem('auth_token', account.email);
            setAuthState(true, account);

            navigateTo('#/profile');
        });
    }
  // Logout
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('auth_token');
            setAuthState(false, null);
            navigateTo('#/');
        });
    }
}

// Keep verify-email page text updated with stored email
function updateVerifyEmailMessage() {
    const email = localStorage.getItem('unverified_email');
    const span = document.getElementById('verify-email-address');
    if (span) {
        span.textContent = email || '(no email)';
    }
}

// Listen for hash changes
window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#/verify-email')) {
        updateVerifyEmailMessage();
    }
    handleRouting();
});

// On initial load
window.addEventListener('DOMContentLoaded', () => {
    // Restore auth from localStorage if present
    const token = localStorage.getItem('auth_token');
    if (token) {
        const account = window.db.accounts.find(
            (acc) => acc.email === token && acc.verified === true
        );
        if (account) {
            setAuthState(true, account);
        }
    }

    setupAuthForms();
    setupAccountsAdmin();
    setupDepartmentsAdmin();
    setupEmployeesAdmin();
    setupRequests();
    updateVerifyEmailMessage();

    if (!window.location.hash) {
        navigateTo('#/');
    } else {
        handleRouting();
    }
});

