// Global variables
let currentUser = null;

// Utility functions
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 12px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        font-weight: 600;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Authentication functions
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            // Store user info in localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email
            }));
            
            // If on login page, redirect to main
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                window.location.href = './main.html';
            }
        } else {
            currentUser = null;
            localStorage.removeItem('currentUser');
            
            // If not on login page, redirect to login
            if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                window.location.href = './index.html';
            }
        }
    });
}

// Login page functionality
if (document.getElementById('loginFormElement')) {
    // Form switching
    document.getElementById('showSignup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
    });

    // Login form submission
    document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            showMessage('Login berhasil!');
            window.location.href = './main.html';
        } catch (error) {
            hideLoading();
            showMessage('Login gagal: ' + error.message, 'error');
        }
    });

    // Signup form submission
    document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const kelas = document.getElementById('signupClass').value;

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save additional user info to Firestore
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                class: kelas,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showMessage('Pendaftaran berhasil!');
            window.location.href = './main.html';
        } catch (error) {
            hideLoading();
            showMessage('Pendaftaran gagal: ' + error.message, 'error');
        }
    });
}

// Main page functionality
if (document.getElementById('hamburger')) {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    
    // Update current time
    function updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }
    
    // Update time every second
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
            sidebar.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });

    // Navigation functionality
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.getAttribute('href') && item.getAttribute('href') !== '#') {
                return; // Let normal navigation happen
            }
            
            e.preventDefault();
            const page = item.getAttribute('data-page');
            
            if (page) {
                // Remove active class from all nav items
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Hide all content sections
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Show selected content
                const contentId = page + 'Content';
                const content = document.getElementById(contentId);
                if (content) {
                    content.classList.remove('hidden');
                }
                
                // Load data for specific pages
                if (page === 'pelajaran') {
                    loadJadwalData();
                }
                
                // Close sidebar
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });

    // Action buttons functionality
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = btn.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                
                // Remove active class from all nav items
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                
                // Add active class to corresponding nav item
                const navItem = document.querySelector(`[data-page="${page}"]`);
                if (navItem) {
                    navItem.classList.add('active');
                }
                
                // Hide all content sections
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Show selected content
                const contentId = page + 'Content';
                const content = document.getElementById(contentId);
                if (content) {
                    content.classList.remove('hidden');
                }
                
                // Load data for specific pages
                if (page === 'pelajaran') {
                    loadJadwalData();
                }
            }
        });
    });

    // === MANAJEMEN PELAJARAN FUNCTIONALITY ===
    
    // Pelajaran form submission
    const pelajaranForm = document.getElementById('pelajaranForm');
    if (pelajaranForm) {
        pelajaranForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();

            const formData = {
                kelas: document.getElementById('pilihKelas').value,
                mapel: document.getElementById('mataPelajaran').value,
                jamMulai: document.getElementById('jamMulai').value,
                jamAkhir: document.getElementById('jamAkhir').value,
                hari: document.getElementById('hariPelajaran').value,
                guruId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await db.collection('jadwal').add(formData);
                hideLoading();
                showMessage('Jadwal pelajaran berhasil disimpan!');
                pelajaranForm.reset();
                loadJadwalData(); // Refresh table
                updateActiveSchedulesCount(); // Update dashboard stats
            } catch (error) {
                hideLoading();
                showMessage('Gagal menyimpan jadwal: ' + error.message, 'error');
            }
        });
    }

    // Load jadwal data
    async function loadJadwalData() {
        const tbody = document.getElementById('jadwalTableBody');
        if (!tbody) return;

        try {
            const snapshot = await db.collection('jadwal').orderBy('kelas').orderBy('hari').get();
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" class="no-data">Belum ada jadwal yang ditambahkan.</td></tr>';
            } else {
                tbody.innerHTML = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${data.kelas}</td>
                        <td>${data.mapel}</td>
                        <td>${data.hari}</td>
                        <td>${data.jamMulai}</td>
                        <td>${data.jamAkhir}</td>
                        <td>
                            <button class="btn-delete" data-id="${doc.id}">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                
                // Add delete event listeners
                document.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const docId = e.target.closest('.btn-delete').getAttribute('data-id');
                        if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
                            try {
                                await db.collection('jadwal').doc(docId).delete();
                                showMessage('Jadwal berhasil dihapus!');
                                loadJadwalData(); // Refresh table
                                updateActiveSchedulesCount(); // Update dashboard stats
                            } catch (error) {
                                showMessage('Gagal menghapus jadwal: ' + error.message, 'error');
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error("Error loading schedule:", error);
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">Gagal memuat data.</td></tr>';
        }
    }

    // Filter jadwal by class
    const filterKelas = document.getElementById('filterKelas');
    if (filterKelas) {
        filterKelas.addEventListener('change', async () => {
            const selectedKelas = filterKelas.value;
            const tbody = document.getElementById('jadwalTableBody');
            
            try {
                let query = db.collection('jadwal').orderBy('hari');
                
                if (selectedKelas) {
                    query = query.where('kelas', '==', selectedKelas);
                }
                
                const snapshot = await query.get();
                
                if (snapshot.empty) {
                    tbody.innerHTML = '<tr><td colspan="6" class="no-data">Tidak ada jadwal untuk filter yang dipilih.</td></tr>';
                } else {
                    tbody.innerHTML = '';
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${data.kelas}</td>
                            <td>${data.mapel}</td>
                            <td>${data.hari}</td>
                            <td>${data.jamMulai}</td>
                            <td>${data.jamAkhir}</td>
                            <td>
                                <button class="btn-delete" data-id="${doc.id}">
                                    <i class="fas fa-trash"></i> Hapus
                                </button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    // Add delete event listeners
                    document.querySelectorAll('.btn-delete').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const docId = e.target.closest('.btn-delete').getAttribute('data-id');
                            if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
                                try {
                                    await db.collection('jadwal').doc(docId).delete();
                                    showMessage('Jadwal berhasil dihapus!');
                                    loadJadwalData();
                                    updateActiveSchedulesCount();
                                } catch (error) {
                                    showMessage('Gagal menghapus jadwal: ' + error.message, 'error');
                                }
                            }
                        });
                    });
                }
            } catch (error) {
                console.error("Error filtering schedule:", error);
                tbody.innerHTML = '<tr><td colspan="6" class="no-data">Gagal memuat data.</td></tr>';
            }
        });
    }

    // Update active schedules count for dashboard
    async function updateActiveSchedulesCount() {
        try {
            const snapshot = await db.collection('jadwal').get();
            const count = snapshot.size;
            const activeSchedulesElement = document.getElementById('activeSchedules');
            if (activeSchedulesElement) {
                activeSchedulesElement.textContent = count;
            }
        } catch (error) {
            console.error('Error updating active schedules count:', error);
        }
    }

    // Admin modal functionality
    const adminModal = document.getElementById('adminModal');
    const adminPasswordInput = document.getElementById('adminPassword');
    
    function showAdminModal() {
        adminModal.classList.remove('hidden');
        adminPasswordInput.focus();
    }
    
    function hideAdminModal() {
        adminModal.classList.add('hidden');
        adminPasswordInput.value = '';
    }
    
    function checkAdminPassword() {
        const password = adminPasswordInput.value;
        if (password === 'Tambaksari322') {
            hideAdminModal();
            window.location.href = './admin.html';
        } else {
            showMessage('Kata sandi salah!', 'error');
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
        }
    }

    // Admin access events
    document.getElementById('adminAccess').addEventListener('click', (e) => {
        e.preventDefault();
        showAdminModal();
    });

    const adminAccess2 = document.getElementById('adminAccess2');
    if (adminAccess2) {
        adminAccess2.addEventListener('click', (e) => {
            e.preventDefault();
            showAdminModal();
        });
    }

    const loginAdmin = document.getElementById('loginAdmin');
    if (loginAdmin) {
        loginAdmin.addEventListener('click', (e) => {
            e.preventDefault();
            showAdminModal();
        });
    }

    // Modal events
    document.getElementById('closeAdminModal').addEventListener('click', hideAdminModal);
    document.getElementById('cancelAdmin').addEventListener('click', hideAdminModal);
    document.getElementById('submitAdmin').addEventListener('click', checkAdminPassword);
    
    // Enter key support for admin password
    adminPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAdminPassword();
        }
    });
    
    // Close modal when clicking outside
    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            hideAdminModal();
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            try {
                await auth.signOut();
                showMessage('Berhasil keluar');
                window.location.href = './index.html';
            } catch (error) {
                showMessage('Gagal keluar: ' + error.message, 'error');
            }
        }
    });

    // Load user info and auto-fill forms
    async function loadUserInfo() {
        if (currentUser) {
            try {
                const userDoc = await db.collection('users').doc(currentUser.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    // Update sidebar with user info
                    document.getElementById('userName').textContent = userData.name || 'Nama Guru';
                    
                    // Update welcome message
                    const welcomeUserName = document.getElementById('welcomeUserName');
                    if (welcomeUserName) {
                        welcomeUserName.textContent = userData.name || 'Guru';
                    }
                    
                    // Auto-fill izin form with readonly fields
                    const izinNama = document.getElementById('izinNama');
                    if (izinNama) {
                        izinNama.value = userData.name || '';
                        izinNama.readOnly = true;
                        izinNama.style.backgroundColor = '#f8f9fa';
                        izinNama.style.cursor = 'not-allowed';
                    }
                }
            } catch (error) {
                console.error('Error loading user info:', error);
            }
        }
    }

    // Izin/Sakit form submission
    const izinForm = document.getElementById('izinForm');
    if (izinForm) {
        izinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();

            const formData = {
                nama: document.getElementById('izinNama').value,
                jenis: document.getElementById('izinJenis').value,
                tanggal: document.getElementById('izinTanggal').value,
                deskripsi: document.getElementById('izinDeskripsi').value,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await db.collection('izin_sakit').add(formData);
                hideLoading();
                showMessage('Formulir berhasil dikirim!');
                izinForm.reset();
                // Reload user info to refill the readonly name field
                await loadUserInfo();
                // Refresh stats after form submission
                setTimeout(() => {
                    loadStats();
                }, 1000);
            } catch (error) {
                hideLoading();
                showMessage('Gagal mengirim formulir: ' + error.message, 'error');
            }
        });
    }

    // Load stats function
    async function loadStats() {
        console.log('🔄 Loading dashboard stats...');
        
        try {
            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            console.log('📅 Today date:', todayString);
            
            // 1. KEHADIRAN HARI INI - Count all students who marked "Hadir" today
            console.log('📊 Fetching today attendance...');
            const todayAttendanceSnapshot = await db.collection('absensi')
                .where('tanggal', '==', todayString)
                .where('keterangan', '==', 'Hadir')
                .get();
            
            const todayAttendanceCount = todayAttendanceSnapshot.size;
            console.log('✅ Today attendance count:', todayAttendanceCount);
            document.getElementById('todayAttendance').textContent = todayAttendanceCount;

            // 2. TOTAL IZIN/SAKIT - Count all izin/sakit forms ever submitted
            console.log('📊 Fetching total izin/sakit...');
            const izinSakitSnapshot = await db.collection('izin_sakit').get();
            const totalIzinSakitCount = izinSakitSnapshot.size;
            console.log('✅ Total izin/sakit count:', totalIzinSakitCount);
            document.getElementById('totalAbsence').textContent = totalIzinSakitCount;

            // 3. JADWAL AKTIF - Count all active schedules
            console.log('📊 Fetching active schedules...');
            const jadwalSnapshot = await db.collection('jadwal').get();
            const activeSchedulesCount = jadwalSnapshot.size;
            console.log('✅ Active schedules count:', activeSchedulesCount);
            document.getElementById('activeSchedules').textContent = activeSchedulesCount;
            
            console.log('✅ All stats loaded successfully!');
            
        } catch (error) {
            console.error('❌ Error loading stats:', error);
            // Set default values on error
            document.getElementById('todayAttendance').textContent = '0';
            document.getElementById('totalAbsence').textContent = '0';
            document.getElementById('activeSchedules').textContent = '0';
            showMessage('Gagal memuat statistik dashboard', 'error');
        }
    }

    // Set up real-time listeners for automatic updates
    function setupRealTimeListeners() {
        console.log('🔄 Setting up real-time listeners...');
        
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Listen for today's attendance changes
        db.collection('absensi')
            .where('tanggal', '==', today)
            .where('keterangan', '==', 'Hadir')
            .onSnapshot((snapshot) => {
                console.log('🔄 Today attendance updated:', snapshot.size);
                document.getElementById('todayAttendance').textContent = snapshot.size;
            }, (error) => {
                console.error('❌ Error in today attendance listener:', error);
            });

        // 2. Listen for izin/sakit forms changes
        db.collection('izin_sakit')
            .onSnapshot((snapshot) => {
                console.log('🔄 Izin/sakit forms updated:', snapshot.size);
                document.getElementById('totalAbsence').textContent = snapshot.size;
            }, (error) => {
                console.error('❌ Error in izin/sakit listener:', error);
            });

        // 3. Listen for jadwal changes
        db.collection('jadwal')
            .onSnapshot((snapshot) => {
                console.log('🔄 Active schedules updated:', snapshot.size);
                document.getElementById('activeSchedules').textContent = snapshot.size;
            }, (error) => {
                console.error('❌ Error in jadwal listener:', error);
            });
        
        console.log('✅ Real-time listeners set up successfully!');
    }

    // Initialize main page with proper auth state handling
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User authenticated:', user.uid);
            
            // Load user info first
            await loadUserInfo();
            
            // Load initial stats
            await loadStats();
            
            // Set up real-time listeners for automatic updates
            setupRealTimeListeners();
            
        } else {
            console.log('❌ No user authenticated');
            // Set default values when no user
            document.getElementById('todayAttendance').textContent = '0';
            document.getElementById('totalAbsence').textContent = '0';
            document.getElementById('activeSchedules').textContent = '0';
        }
    });
}

// Absensi page functionality
if (document.getElementById('absensiForm')) {
    // Set current date
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = formatDate(new Date());
    }

    // Show/hide reason field based on radio selection
    const radioButtons = document.querySelectorAll('input[name="keterangan"]');
    const alasanGroup = document.getElementById('alasanGroup');
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'Izin' || radio.value === 'Sakit' || radio.value === 'Alpha') {
                alasanGroup.classList.remove('hidden');
            } else {
                alasanGroup.classList.add('hidden');
            }
        });
    });

    // Function to load mata pelajaran based on student's class
    async function loadPelajaranUntukSiswa(kelasSiswa) {
        const pelajaranSelect = document.getElementById('absensiPelajaran');
        if (!pelajaranSelect) return;

        pelajaranSelect.innerHTML = '<option value="">Memuat mata pelajaran...</option>';

        try {
            const snapshot = await db.collection('jadwal').where('kelas', '==', kelasSiswa).get();
            
            if (snapshot.empty) {
                pelajaranSelect.innerHTML = '<option value="">Tidak ada jadwal untuk kelas ini</option>';
            } else {
                pelajaranSelect.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
                snapshot.forEach(doc => {
                    const jadwal = doc.data();
                    const option = document.createElement('option');
                    option.value = `${jadwal.mapel} (${jadwal.hari}, ${jadwal.jamMulai}-${jadwal.jamAkhir})`;
                    option.textContent = `${jadwal.mapel} (${jadwal.hari}, ${jadwal.jamMulai}-${jadwal.jamAkhir})`;
                    pelajaranSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error loading subjects:", error);
            pelajaranSelect.innerHTML = '<option value="">Gagal memuat pelajaran</option>';
        }
    }

    // Load user info for absensi form and make fields readonly
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    // Auto-fill and make readonly
                    const namaField = document.getElementById('absensiNama');
                    const kelasField = document.getElementById('absensiKelas');
                    
                    if (namaField) {
                        namaField.value = userData.name || '';
                    }
                    
                    if (kelasField) {
                        kelasField.value = userData.class || '';
                        // Load mata pelajaran after class is set
                        loadPelajaranUntukSiswa(userData.class);
                    }
                }
            } catch (error) {
                console.error('Error loading user info:', error);
            }
        }
    });

    // Absensi form submission
    document.getElementById('absensiForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        const today = new Date().toISOString().split('T')[0];
        
        // Get selected radio button value
        const selectedKeterangan = document.querySelector('input[name="keterangan"]:checked');
        if (!selectedKeterangan) {
            hideLoading();
            showMessage('Harap pilih keterangan kehadiran!', 'error');
            return;
        }

        const formData = {
            nama: document.getElementById('absensiNama').value,
            kelas: document.getElementById('absensiKelas').value,
            pelajaran: document.getElementById('absensiPelajaran').value,
            keterangan: selectedKeterangan.value,
            alasan: document.getElementById('absensiAlasan').value,
            tanggal: today,
            userId: currentUser ? currentUser.uid : null,
            userEmail: currentUser ? currentUser.email : null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Validate mata pelajaran selection
        if (!formData.pelajaran) {
            hideLoading();
            showMessage('Harap pilih mata pelajaran terlebih dahulu!', 'error');
            return;
        }

        try {
            await db.collection('absensi').add(formData);
            hideLoading();
            
            // Update success message with details
            const successTime = document.getElementById('successTime');
            const successDetails = document.getElementById('successDetails');
            
            if (successTime) {
                successTime.textContent = formatDateTime(new Date());
            }
            
            if (successDetails) {
                successDetails.innerHTML = `
                    <div style="display: grid; gap: 10px; text-align: left; margin-top: 15px;">
                        <div><strong>Nama:</strong> ${formData.nama}</div>
                        <div><strong>Kelas:</strong> ${formData.kelas}</div>
                        <div><strong>Mata Pelajaran:</strong> ${formData.pelajaran}</div>
                        <div><strong>Keterangan:</strong> <span style="color: ${formData.keterangan === 'Hadir' ? '#27ae60' : '#e74c3c'}">${formData.keterangan}</span></div>
                        ${formData.alasan ? `<div><strong>Alasan:</strong> ${formData.alasan}</div>` : ''}
                    </div>
                `;
            }
            
            // Show success message
            document.getElementById('successMessage').classList.remove('hidden');
            document.getElementById('absensiForm').style.display = 'none';
            
            setTimeout(() => {
                window.location.href = './main.html';
            }, 3000);
        } catch (error) {
            hideLoading();
            showMessage('Gagal menyimpan absensi: ' + error.message, 'error');
        }
    });
}

// Admin page functionality
if (document.querySelector('.admin-page')) {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName + 'Tab').classList.add('active');
            
            // Load data for the selected tab
            if (tabName === 'absensi') {
                loadAbsensiData();
            } else if (tabName === 'izin') {
                loadIzinData();
            }
        });
    });

    // Load absensi data
    async function loadAbsensiData(filters = {}) {
        showLoading();
        try {
            let query = db.collection('absensi').orderBy('createdAt', 'desc');
            
            // Apply filters
            if (filters.date) {
                query = query.where('tanggal', '==', filters.date);
            }
            if (filters.status) {
                query = query.where('keterangan', '==', filters.status);
            }
            
            const snapshot = await query.get();
            const tbody = document.getElementById('absensiTableBody');
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" class="no-data">Tidak ada data</td></tr>';
            } else {
                tbody.innerHTML = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDate(data.tanggal)}</td>
                        <td>${data.nama}</td>
                        <td>${data.kelas}</td>
                        <td>${data.pelajaran || '-'}</td>
                        <td><span class="status-badge ${data.keterangan.toLowerCase()}">${data.keterangan}</span></td>
                        <td>${data.alasan || '-'}</td>
                    `;
                    tbody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading absensi data:', error);
            showMessage('Gagal memuat data absensi', 'error');
        }
        hideLoading();
    }

    // Load izin/sakit data
    async function loadIzinData(filters = {}) {
        showLoading();
        try {
            let query = db.collection('izin_sakit').orderBy('createdAt', 'desc');
            
            // Apply filters
            if (filters.date) {
                query = query.where('tanggal', '==', filters.date);
            }
            if (filters.type) {
                query = query.where('jenis', '==', filters.type);
            }
            
            const snapshot = await query.get();
            const tbody = document.getElementById('izinTableBody');
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5" class="no-data">Tidak ada data</td></tr>';
            } else {
                tbody.innerHTML = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${data.createdAt ? formatDateTime(data.createdAt.toDate()) : '-'}</td>
                        <td>${data.nama}</td>
                        <td><span class="status-badge ${data.jenis.toLowerCase()}">${data.jenis}</span></td>
                        <td>${formatDate(data.tanggal)}</td>
                        <td>${data.deskripsi}</td>
                    `;
                    tbody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading izin data:', error);
            showMessage('Gagal memuat data izin/sakit', 'error');
        }
        hideLoading();
    }

    // Filter functionality
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            const filters = {
                date: document.getElementById('filterDate').value,
                status: document.getElementById('filterStatus').value
            };
            loadAbsensiData(filters);
        });
    }

    const filterIzinBtn = document.getElementById('filterIzinBtn');
    if (filterIzinBtn) {
        filterIzinBtn.addEventListener('click', () => {
            const filters = {
                date: document.getElementById('filterIzinDate').value,
                type: document.getElementById('filterIzinType').value
            };
            loadIzinData(filters);
        });
    }

    // Initial data load
    loadAbsensiData();
}

// Initialize auth state checking
checkAuthState();

