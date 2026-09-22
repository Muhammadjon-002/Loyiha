import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ---> O'ZINGIZNING FIREBASE CONFIG'INGIZNI SHU YERGA YOZING <---
  const firebaseConfig = {
    apiKey: "AIzaSyAOpnU6UBEByDRhYRX_ANx-U6WfYdBeiJw",
    authDomain: "school-project-116.firebaseapp.com",
    projectId: "school-project-116",
    storageBucket: "school-project-116.firebasestorage.app",
    messagingSenderId: "1074011495879",
    appId: "1:1074011495879:web:496ed677b98d7875d18de2"
  };

  // Initialize Firebase

  const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserUid = null;
let currentGrade = 7;
let isSignUpMode = false; // Hozirgi rejim: kirish yoki ro'yxatdan o'tish
let schoolData = {
    7: { columns: [], students: [] },
    8: { columns: [], students: [] },
    9: { columns: [], students: [] },
    10: { columns: [], students: [] },
    11: { columns: [], students: [] }
};

// Elementlar
const authModal = document.getElementById('authModal');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authActionBtn = document.getElementById('authActionBtn');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const switchAuthMode = document.getElementById('switchAuthMode');
const switchText = document.getElementById('switchText');
const currentUserDisplay = document.getElementById('currentUserDisplay');

const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');

// Foydalanuvchi holatini kuzatish (Avtomatik login)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        authModal.style.display = 'none';
        currentUserDisplay.textContent = `Hisob: ${user.email}`;
        loadDataFromCloud();
    } else {
        currentUserUid = null;
        authModal.style.display = 'flex';
        currentUserDisplay.textContent = `Tizimga kirmagansiz`;
    }
});

// Kirish / Ro'yxatdan o'tish rejimini almashtirish
switchAuthMode.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        modalTitle.textContent = "Ro'yxatdan o'tish";
        modalDesc.textContent = "Yangi akkumulyator ochish uchun email va parol kiriting:";
        authActionBtn.textContent = "Ro'yxatdan o'tish";
        switchText.textContent = "Akkauntingiz bormi?";
        switchAuthMode.textContent = "Tizimga kirish";
    } else {
        modalTitle.textContent = "Tizimga kirish";
        modalDesc.textContent = "Loyihalaringizni boshqarish uchun pochta va parolingizni kiriting:";
        authActionBtn.textContent = "Kirish";
        switchText.textContent = "Akkauntingiz yo'qmi?";
        switchAuthMode.textContent = "Ro'yxatdan o'tish";
    }
});

// Tugmani bosganda kirish yoki ro'yxatdan o'tishni bajarish
authActionBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
        alert("Iltimos, email va parolni to'ldiring!");
        return;
    }

    try {
        if (isSignUpMode) {
            // Ro'yxatdan o'tish
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        } else {
            // Tizimga kirish
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        alert("Xatolik: " + error.message);
    }
});

// Hisobdan chiqish (Logout)
window.logoutUser = function() {
    if (confirm("Hisobdan chiqmoqchimisiz?")) {
        signOut(auth).then(() => {
            location.reload();
        });
    }
};

// Qidiruv va filtr hodisalari
searchInput.addEventListener('input', () => renderTable());
filterSelect.addEventListener('change', () => renderTable());

// Bazadan yuklash (Har bir foydalanuvchining o'z UID si bo'yicha alohida saqlanadi)
async function loadDataFromCloud() {
    try {
        const docRef = doc(db, "users_projects", currentUserUid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            schoolData = docSnap.data();
        } else {
            schoolData = {
                7: { columns: [], students: [] },
                8: { columns: [], students: [] },
                9: { columns: [], students: [] },
                10: { columns: [], students: [] },
                11: { columns: [], students: [] }
            };
            await saveToCloud();
        }
        renderTable();
    } catch (error) {
        console.error("Xatolik:", error);
    }
}

// Bazaga saqlash
async function saveToCloud() {
    try {
        await setDoc(doc(db, "users_projects", currentUserUid), schoolData);
    } catch (error) {
        console.error("Saqlashda xatolik:", error);
    }
}

// Sinf tugmalari
const gradeButtons = document.querySelectorAll('.grade-btn');
gradeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        gradeButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentGrade = e.target.getAttribute('data-grade');
        renderTable();
    });
});

// O'quvchi qo'shish
document.getElementById('addStudentBtn').addEventListener('click', addStudent);
document.getElementById('studentNameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addStudent();
});

async function addStudent() {
    const input = document.getElementById('studentNameInput');
    const name = input.value.trim();
    
    if (!name) {
        input.focus();
        return;
    }

    const gradeData = schoolData[currentGrade];

    if (gradeData.columns.length === 0) {
        gradeData.columns = ["Loyiha 1", "Loyiha 2", "Loyiha 3", "Loyiha 4", "Loyiha 5"];
    }

    const initialStatuses = {};
    gradeData.columns.forEach(col => {
        initialStatuses[col] = null;
    });

    gradeData.students.push({
        id: Date.now(),
        name: name,
        statuses: initialStatuses
    });

    input.value = '';
    await saveToCloud();
    renderTable();
    input.focus();
}

// Ustun qo'shish
document.getElementById('addColumnBtn').addEventListener('click', async () => {
    const gradeData = schoolData[currentGrade];
    
    if (gradeData.students.length === 0) {
        alert("Avval kamida bitta o'quvchi qo'shing!");
        return;
    }

    const colName = prompt("Yangi ustun (loyiha) nomini kiriting:");
    if (!colName || !colName.trim()) return;

    const trimmedCol = colName.trim();
    
    if (gradeData.columns.includes(trimmedCol)) {
        alert("Bunday nomdagi ustun allaqachon mavjud!");
        return;
    }

    gradeData.columns.push(trimmedCol);
    gradeData.students.forEach(student => {
        student.statuses[trimmedCol] = null;
    });

    await saveToCloud();
    renderTable();
});

// Katakcha statusini o'rnatish
window.setCellStatus = async function(studentId, columnName, statusValue) {
    const gradeData = schoolData[currentGrade];
    const student = gradeData.students.find(s => s.id === studentId);
    if (!student) return;

    if (student.statuses[columnName] === statusValue) {
        student.statuses[columnName] = null;
    } else {
        student.statuses[columnName] = statusValue;
    }

    await saveToCloud();
    renderTable();
};

// O'quvchini o'chirish
window.deleteStudent = async function(studentId) {
    const gradeData = schoolData[currentGrade];
    gradeData.students = gradeData.students.filter(s => s.id !== studentId);
    
    if (gradeData.students.length === 0) {
        gradeData.columns = [];
    }

    await saveToCloud();
    renderTable();
};

// Ustunni o'chirish
window.deleteColumn = async function(colName) {
    const gradeData = schoolData[currentGrade];
    if (gradeData.columns.length <= 1) {
        alert("Kamida bitta ustun qolishi kerak!");
        return;
    }
    if (confirm(`"${colName}" ustunini o'chirmoqchimisiz?`)) {
        gradeData.columns = gradeData.columns.filter(c => c !== colName);
        gradeData.students.forEach(student => {
            delete student.statuses[colName];
        });
        await saveToCloud();
        renderTable();
    }
};

// Jadvalni chizish
function renderTable() {
    const headerRow = document.getElementById('tableHeaderRow');
    const tableBody = document.getElementById('tableBody');
    const gradeData = schoolData[currentGrade];

    let headerHTML = `
        <th class="row-number-header">#</th>
        <th class="name-col-header">O'quvchi F.I.Sh.</th>
    `;
    gradeData.columns.forEach((col) => {
        headerHTML += `
            <th class="cell-action">
                ${col} 
                <button onclick="deleteColumn('${col}')" title="Ustunni o'chirish" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:11px;margin-left:6px;padding:2px 4px;">✕</button>
            </th>
        `;
    });
    headerRow.innerHTML = headerHTML;

    if (gradeData.students.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="2">Bu sinfda hali o'quvchilar qo'shilmagan. Yuqoridan ism kiriting!</td>
            </tr>
        `;
        return;
    }

    const searchText = searchInput.value.toLowerCase().trim();
    let filteredStudents = gradeData.students.filter(student => 
        student.name.toLowerCase().includes(searchText)
    );

    const filterValue = filterSelect.value;
    if (filterValue !== 'default') {
        filteredStudents.sort((a, b) => {
            if (filterValue === 'az') {
                return a.name.localeCompare(b.name);
            } else if (filterValue === 'za') {
                return b.name.localeCompare(a.name);
            } else if (gradeData.columns.length > 0) {
                const firstCol = gradeData.columns[0];
                const statusA = a.statuses[firstCol];
                const statusB = b.statuses[firstCol];

                const getRank = (st) => {
                    if (st === false) return 1;
                    if (st === true) return 2;
                    return 3;
                };

                const rankA = getRank(statusA);
                const rankB = getRank(statusB);

                if (filterValue === 'not_done_first') {
                    return rankA - rankB;
                } else if (filterValue === 'done_first') {
                    const getDoneRank = (st) => {
                        if (st === true) return 1;
                        if (st === false) return 2;
                        return 3;
                    };
                    return getDoneRank(statusA) - getDoneRank(statusB);
                }
            }
            return 0;
        });
    }

    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="2">Bunday o'quvchi topilmadi.</td>
            </tr>
        `;
        return;
    }

    let bodyHTML = '';
    filteredStudents.forEach((student, index) => {
        bodyHTML += `<tr>`;
        bodyHTML += `<td class="row-number">${index + 1}</td>`;
        bodyHTML += `
            <td class="student-name-td">
                <div class="student-name-cell">
                    <span>${student.name}</span>
                    <button class="delete-student" onclick="deleteStudent(${student.id})">O'chirish</button>
                </div>
            </td>
        `;

        gradeData.columns.forEach(col => {
            const status = student.statuses[col];
            let btnClass = 'grid-cell-btn';
            let btnContent = '';

            if (status === true) {
                btnClass += ' checked';
                btnContent = '✅';
            } else if (status === false) {
                btnClass += ' unchecked';
                btnContent = '❌';
            }

            bodyHTML += `
                <td class="cell-action">
                    <div class="cell-wrapper">
                        <button class="${btnClass}">${btnContent}</button>
                        <div class="hover-menu">
                            <button class="mini-btn yes" onclick="setCellStatus(${student.id}, '${col}', true)" title="Bajarilgan">✅</button>
                            <button class="mini-btn no" onclick="setCellStatus(${student.id}, '${col}', false)" title="Bajarilmagan">❌</button>
                        </div>
                    </div>
                </td>
            `;
        });

        bodyHTML += `</tr>`;
    });

    tableBody.innerHTML = bodyHTML;
}

const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const authPasswordInput = document.getElementById('authPassword');

if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        if (authPasswordInput.type === 'password') {
            authPasswordInput.type = 'text';
            togglePasswordBtn.textContent = '🙈';
        } else {
            authPasswordInput.type = 'password';
            togglePasswordBtn.textContent = '👁️';
        }
    });
}