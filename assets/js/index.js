import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---> O'ZINGIZNING FIREBASE CONFIG'INGIZni SHU YERGA YOZING <---
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

let currentRoom = localStorage.getItem('user_room_id') || null;
let currentGrade = 7;
let schoolData = {
    7: { columns: [], students: [] },
    8: { columns: [], students: [] },
    9: { columns: [], students: [] },
    10: { columns: [], students: [] },
    11: { columns: [], students: [] }
};

const roomModal = document.getElementById('roomModal');
const roomInput = document.getElementById('roomInput');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const currentRoomDisplay = document.getElementById('currentRoomDisplay');

if (currentRoom) {
    roomModal.style.display = 'none';
    currentRoomDisplay.textContent = `Xona: ${currentRoom}`;
    loadDataFromCloud();
} else {
    roomModal.style.display = 'flex';
}

// Xona oynasini ochish funksiyasi (tugmani bosganda ishlaydi)
window.openRoomModal = function() {
    roomInput.value = currentRoom || '';
    roomModal.style.display = 'flex';
};

joinRoomBtn.addEventListener('click', () => {
    const room = roomInput.value.trim().toLowerCase();
    if (!room) {
        alert("Iltimos, xona yoki ism kiriting!");
        return;
    }
    currentRoom = room;
    localStorage.setItem('user_room_id', currentRoom);
    roomModal.style.display = 'none';
    currentRoomDisplay.textContent = `Xona: ${currentRoom}`;
    loadDataFromCloud();
});

// Bazadan yuklash
async function loadDataFromCloud() {
    try {
        const docRef = doc(db, "rooms", currentRoom);
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
        alert("Internet yoki Firebase ulanishida xatolik bor!");
    }
}

// Bazaga saqlash
async function saveToCloud() {
    try {
        await setDoc(doc(db, "rooms", currentRoom), schoolData);
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
    if (!name) return;

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

    let bodyHTML = '';
    gradeData.students.forEach((student, index) => {
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