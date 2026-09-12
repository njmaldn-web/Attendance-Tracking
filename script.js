// ==========================================
// 1. Storage Helpers
// ==========================================
const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

let currentUser = null;

// ==========================================
// 2. Initializer Database
// ==========================================
function initDatabase() {
  let storedUsers = getData('sys_users');
  
  if (!storedUsers.some(u => u.username === 'admin')) {
    const defaultUsers = [
      { username: 'admin', password: '123', role: 'admin', name: 'إدارة النظام' }
    ];

    // أسماء حقيقية تجريبية للطلاب
    const studentNames = [
      'أحمد محمد علي', 'عمر خالد حسن', 'مصطفى محمود إبراهيم', 'عبدالرحمن يوسف',
      'حمزة طارق عثمان', 'علي يحيى بدر', 'زياد أحمد جمال', 'ياسين محمد كريم',
      'كريم هاني سعيد', 'سارة أحمد محمود', 'نور الدين مصطفى', 'يوسف حسن علي',
      'خالد وليد إسماعيل', 'محمد طارق فاروق', 'عبدالله عمر جابر', 'إبراهيم سامي',
      'بلال أيمن صلاح', 'أنس ماجد رشيد', 'سيف الدين ماهر', 'حمزة إيهاب سليمان'
    ];

    const defaultStudents = [];

    for (let i = 0; i < studentNames.length; i++) {
      const stdId = `std_${i + 1}`;
      const realName = studentNames[i];
      const stdClass = i < 10 ? 'الصف الثاني ثانوي' : 'الصف الثالث ثانوي';

      defaultStudents.push({
        id: stdId,
        name: realName,
        class: stdClass
      });

      defaultUsers.push({
        username: `student${i + 1}`,
        password: '123',
        role: 'student',
        name: realName,
        studentId: stdId
      });

      defaultUsers.push({
        username: `parent${i + 1}`,
        password: '123',
        role: 'parent',
        name: `ولي أمر الطالب (${realName})`,
        studentId: stdId
      });
    }

    // المعلمون
    const subjects = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'اللغة العربية', 'اللغة الإنجليزية', 'الأحياء', 'التربية الإسلامية', 'الحاسوب', 'التاريخ', 'الجغرافيا'];
    for (let j = 0; j < subjects.length; j++) {
      defaultUsers.push({
        username: `teacher${j + 1}`,
        password: '123',
        role: 'teacher',
        name: `أ. معلم ${subjects[j]}`
      });
    }

    localStorage.setItem('sys_users', JSON.stringify(defaultUsers));
    localStorage.setItem('sys_students', JSON.stringify(defaultStudents));
  }

  if (!localStorage.getItem('sys_attendance')) localStorage.setItem('sys_attendance', JSON.stringify([]));
  if (!localStorage.getItem('sys_homework')) localStorage.setItem('sys_homework', JSON.stringify([]));
  if (!localStorage.getItem('sys_notes')) localStorage.setItem('sys_notes', JSON.stringify([]));
  if (!localStorage.getItem('sys_grades')) localStorage.setItem('sys_grades', JSON.stringify([]));
}

// ==========================================
// 3. Auth Operations
// ==========================================
function login() {
  const uInput = document.getElementById('username').value.trim();
  const pInput = document.getElementById('password').value.trim();
  
  const users = getData('sys_users');
  const user = users.find(u => u.username === uInput && u.password === pInput);

  if (user) {
    currentUser = user;
    document.getElementById('body-tag').classList.remove('login-page');
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('main-container').classList.remove('hidden');
    
    document.getElementById('welcome-msg').innerText = `أهلاً بك، ${user.name}`;
    
    if (user.role === 'admin') {
      document.getElementById('user-role-badge').innerText = 'مدير النظام';
      showAdminDashboard();
    } else if (user.role === 'teacher') {
      document.getElementById('user-role-badge').innerText = 'عضو هيئة التدريس';
      showTeacherDashboard();
    } else {
      document.getElementById('user-role-badge').innerText = user.role === 'parent' ? 'بوابة ولي الأمر' : 'بوابة الطالب';
      showStudentParentDashboard(user.studentId);
    }
  } else {
    alert('بيانات الدخول غير صحيحة!');
  }
}

function logout() {
  currentUser = null;
  document.getElementById('body-tag').classList.add('login-page');
  document.getElementById('main-container').classList.add('hidden');
  document.getElementById('admin-view').classList.add('hidden');
  document.getElementById('teacher-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  document.getElementById('login-view').classList.remove('hidden');
}

// ==========================================
// 4. Admin Dashboard Operations
// ==========================================
function switchAdminTab(tabName) {
  document.getElementById('admin-tab-students').classList.add('hidden');
  document.getElementById('admin-tab-teachers').classList.add('hidden');
  document.getElementById('admin-tab-parents').classList.add('hidden');

  document.getElementById('btn-tab-students').classList.remove('active-tab');
  document.getElementById('btn-tab-teachers').classList.remove('active-tab');
  document.getElementById('btn-tab-parents').classList.remove('active-tab');

  if (tabName === 'students') {
    document.getElementById('admin-tab-students').classList.remove('hidden');
    document.getElementById('btn-tab-students').classList.add('active-tab');
  } else if (tabName === 'teachers') {
    document.getElementById('admin-tab-teachers').classList.remove('hidden');
    document.getElementById('btn-tab-teachers').classList.add('active-tab');
  } else if (tabName === 'parents') {
    document.getElementById('admin-tab-parents').classList.remove('hidden');
    document.getElementById('btn-tab-parents').classList.add('active-tab');
  }
}

function showAdminDashboard() {
  document.getElementById('admin-view').classList.remove('hidden');
  updateAdminStudentDropdown();
  renderAdminStudentsTable();
  renderAdminTeachersTable();
  renderAdminParentsTable();
  switchAdminTab('students');
}

function updateAdminStudentDropdown() {
  const students = getData('sys_students');
  const select = document.getElementById('add-prt-student-select');
  if (!select) return;
  select.innerHTML = students.length ? '' : '<option value="">لا يوجد طلاب مسجلين</option>';
  students.forEach(s => {
    select.innerHTML += `<option value="${s.id}">${s.name} (${s.class})</option>`;
  });
}

function renderAdminStudentsTable() {
  const students = getData('sys_students');
  const table = document.getElementById('admin-students-table');
  table.innerHTML = students.length ? '' : '<tr><td colspan="4">لا يوجد طلاب مسجلين حالياً بالنظام</td></tr>';
  students.forEach(s => {
    table.innerHTML += `
      <tr>
        <td>${s.id}</td>
        <td>${s.name}</td>
        <td>${s.class}</td>
        <td>
          <button onclick="editStudent('${s.id}')" class="btn-warning btn-action">تعديل</button>
          <button onclick="deleteStudent('${s.id}')" class="btn-danger btn-action">حذف</button>
        </td>
      </tr>
    `;
  });
}

function createStudent() {
  const name = document.getElementById('add-std-name').value.trim();
  const stdClass = document.getElementById('add-std-class').value.trim();
  const username = document.getElementById('add-std-user').value.trim();
  const password = document.getElementById('add-std-pass').value.trim();

  if (!name || !stdClass || !username || !password) return alert('يرجى تعبئة كافة حقول الطالب');

  const users = getData('sys_users');
  if (users.some(u => u.username === username)) return alert('اسم المستخدم مستخدم مسبقاً!');

  const studentId = 'std_' + Date.now();
  const students = getData('sys_students');
  
  students.push({ id: studentId, name, class: stdClass });
  users.push({ username, password, role: 'student', name, studentId });

  setData('sys_students', students);
  setData('sys_users', users);

  alert('تم تسجيل الطالب بنجاح!');
  document.getElementById('add-std-name').value = '';
  document.getElementById('add-std-class').value = '';
  document.getElementById('add-std-user').value = '';
  document.getElementById('add-std-pass').value = '';
  
  updateAdminStudentDropdown();
  renderAdminStudentsTable();
}

function editStudent(studentId) {
  const students = getData('sys_students');
  const student = students.find(s => s.id === studentId);
  if (!student) return;

  const newName = prompt('تعديل اسم الطالب الحقيقي:', student.name);
  const newClass = prompt('تعديل الصف الدراسي:', student.class);
  if (!newName || !newClass) return;

  student.name = newName.trim();
  student.class = newClass.trim();

  const users = getData('sys_users');
  const userObj = users.find(u => u.studentId === studentId && u.role === 'student');
  if (userObj) userObj.name = student.name;

  setData('sys_students', students);
  setData('sys_users', users);
  renderAdminStudentsTable();
}

function deleteStudent(studentId) {
  if (!confirm('هل تأكدت من حذف هذا الطالب وتصفية كافة سجلاته؟')) return;
  let students = getData('sys_students').filter(s => s.id !== studentId);
  let users = getData('sys_users').filter(u => u.studentId !== studentId);
  
  setData('sys_students', students);
  setData('sys_users', users);
  renderAdminStudentsTable();
}

function renderAdminTeachersTable() {
  const users = getData('sys_users').filter(u => u.role === 'teacher');
  const table = document.getElementById('admin-teachers-table');
  table.innerHTML = users.length ? '' : '<tr><td colspan="3">لا يوجد معلمين مسجلين</td></tr>';
  users.forEach(t => {
    table.innerHTML += `
      <tr>
        <td>${t.name}</td>
        <td>${t.username}</td>
        <td><button onclick="deleteUser('${t.username}')" class="btn-danger btn-action">حذف</button></td>
      </tr>
    `;
  });
}

function createTeacher() {
  const name = document.getElementById('add-tch-name').value.trim();
  const username = document.getElementById('add-tch-user').value.trim();
  const password = document.getElementById('add-tch-pass').value.trim();

  if (!name || !username || !password) return alert('يرجى تعبئة بيانات المعلم بالكامل');

  const users = getData('sys_users');
  users.push({ username, password, role: 'teacher', name });
  setData('sys_users', users);

  alert('تم إضافة المعلم بنجاح!');
  renderAdminTeachersTable();
}

function renderAdminParentsTable() {
  const users = getData('sys_users').filter(u => u.role === 'parent');
  const students = getData('sys_students');
  const table = document.getElementById('admin-parents-table');
  table.innerHTML = users.length ? '' : '<tr><td colspan="4">لا يوجد أولياء أمور مسجلين</td></tr>';

  users.forEach(p => {
    const student = students.find(s => s.id === p.studentId);
    table.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.username}</td>
        <td>${student ? student.name : 'غير مرتبط'}</td>
        <td><button onclick="deleteUser('${p.username}')" class="btn-danger btn-action">حذف</button></td>
      </tr>
    `;
  });
}

function createParent() {
  const name = document.getElementById('add-prt-name').value.trim();
  const studentId = document.getElementById('add-prt-student-select').value;
  const username = document.getElementById('add-prt-user').value.trim();
  const password = document.getElementById('add-prt-pass').value.trim();

  if (!name || !studentId || !username || !password) return alert('يرجى تعبئة الحقول بالكامل');

  const users = getData('sys_users');
  users.push({ username, password, role: 'parent', name, studentId });
  setData('sys_users', users);

  alert('تم ربط ولي الأمر بنجاح!');
  renderAdminParentsTable();
}

function deleteUser(username) {
  if (!confirm('حذف هذا الحساب؟')) return;
  let users = getData('sys_users').filter(u => u.username !== username);
  setData('sys_users', users);
  renderAdminTeachersTable();
  renderAdminParentsTable();
}

// ==========================================
// 5. Teacher Operations (تعديل وحذف كافة السجلات)
// ==========================================
function switchTeacherTab(tabName) {
  document.getElementById('tch-tab-grades').classList.add('hidden');
  document.getElementById('tch-tab-attendance').classList.add('hidden');
  document.getElementById('tch-tab-homework').classList.add('hidden');
  document.getElementById('tch-tab-notes').classList.add('hidden');

  document.getElementById('btn-tch-grades').classList.remove('active-tab');
  document.getElementById('btn-tch-attendance').classList.remove('active-tab');
  document.getElementById('btn-tch-homework').classList.remove('active-tab');
  document.getElementById('btn-tch-notes').classList.remove('active-tab');

  populateTeacherStudentDropdowns();

  if (tabName === 'grades') {
    document.getElementById('tch-tab-grades').classList.remove('hidden');
    document.getElementById('btn-tch-grades').classList.add('active-tab');
    renderTeacherGradesTable();
  } else if (tabName === 'attendance') {
    document.getElementById('tch-tab-attendance').classList.remove('hidden');
    document.getElementById('btn-tch-attendance').classList.add('active-tab');
    renderTeacherAttendanceTable();
  } else if (tabName === 'homework') {
    document.getElementById('tch-tab-homework').classList.remove('hidden');
    document.getElementById('btn-tch-homework').classList.add('active-tab');
    renderTeacherHomeworkTable();
  } else if (tabName === 'notes') {
    document.getElementById('tch-tab-notes').classList.remove('hidden');
    document.getElementById('btn-tch-notes').classList.add('active-tab');
    renderTeacherNotesTable();
  }
}

function populateTeacherStudentDropdowns() {
  const students = getData('sys_students');
  const studentSelects = [
    document.getElementById('grade-student'),
    document.getElementById('attendance-student'),
    document.getElementById('note-student')
  ];

  studentSelects.forEach(select => {
    if (select) {
      select.innerHTML = students.length ? '' : '<option value="">لا يوجد طلاب مسجلين</option>';
      students.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name} (${s.class})</option>`;
      });
    }
  });
}

function showTeacherDashboard() {
  document.getElementById('teacher-view').classList.remove('hidden');
  populateTeacherStudentDropdowns();
  switchTeacherTab('grades');
}

// ----------------1. قسم الدرجات----------------
function saveGrade() {
  const studentId = document.getElementById('grade-student').value;
  const subject = document.getElementById('grade-subject').value.trim();
  const work = parseFloat(document.getElementById('grade-work').value);
  const exam = parseFloat(document.getElementById('grade-exam').value);

  if (!studentId || !subject || isNaN(work) || isNaN(exam)) return alert('يرجى ملء كافة البيانات بشكل صحيح');

  const grades = getData('sys_grades');
  grades.push({ id: 'g_' + Date.now(), studentId, subject, work, exam, total: work + exam });
  setData('sys_grades', grades);

  alert('تم حفظ الدرجات بنجاح!');
  document.getElementById('grade-subject').value = '';
  document.getElementById('grade-work').value = '';
  document.getElementById('grade-exam').value = '';

  renderTeacherGradesTable();
}

function renderTeacherGradesTable() {
  const grades = getData('sys_grades');
  const students = getData('sys_students');
  const table = document.getElementById('teacher-grades-table');

  table.innerHTML = grades.length ? '' : '<tr><td colspan="6">لا توجد درجات مرصودة</td></tr>';

  grades.forEach(g => {
    const student = students.find(s => s.id === g.studentId);
    table.innerHTML += `
      <tr>
        <td>${student ? student.name : 'طالب محذوف'}</td>
        <td>${g.subject}</td>
        <td>${g.work}</td>
        <td>${g.exam}</td>
        <td><strong>${g.total}</strong></td>
        <td>
          <button onclick="editGrade('${g.id}')" class="btn-warning btn-action">تعديل</button>
          <button onclick="deleteGrade('${g.id}')" class="btn-danger btn-action">حذف</button>
        </td>
      </tr>
    `;
  });
}

function editGrade(gradeId) {
  const grades = getData('sys_grades');
  const item = grades.find(g => g.id === gradeId);
  if (!item) return;

  const newWork = prompt('تعديل درجات أعمال السنة (من 40):', item.work);
  const newExam = prompt('تعديل درجة الامتحان النهائي (من 60):', item.exam);

  if (newWork !== null && newExam !== null) {
    item.work = parseFloat(newWork) || 0;
    item.exam = parseFloat(newExam) || 0;
    item.total = item.work + item.exam;

    setData('sys_grades', grades);
    renderTeacherGradesTable();
  }
}

function deleteGrade(gradeId) {
  if (!confirm('تأكيد حذف هذه الدرجة؟')) return;
  setData('sys_grades', getData('sys_grades').filter(g => g.id !== gradeId));
  renderTeacherGradesTable();
}

// ----------------2. قسم الحضور والغياب----------------
function saveAttendance() {
  const studentId = document.getElementById('attendance-student').value;
  const date = document.getElementById('attendance-date').value;
  const status = document.getElementById('attendance-status').value;

  if (!studentId || !date) return alert('يرجى اختيار الطالب والتاريخ');

  const attendance = getData('sys_attendance');
  attendance.push({ id: 'att_' + Date.now(), studentId, date, status });
  setData('sys_attendance', attendance);

  alert('تم تسجيل حالة الحضور بنجاح!');
  renderTeacherAttendanceTable();
}

function renderTeacherAttendanceTable() {
  const attendance = getData('sys_attendance');
  const students = getData('sys_students');
  let table = document.getElementById('teacher-attendance-table');
  
  if (!table) {
    const parentCard = document.querySelector('#tch-tab-attendance .teacher-card');
    if (parentCard && !document.getElementById('attendance-table-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.id = 'attendance-table-wrapper';
      wrapper.style.marginTop = '20px';
      wrapper.innerHTML = `
        <h3>سجل الحضور والغياب المدرسي</h3>
        <table>
          <thead>
            <tr><th>اسم الطالب الحقيقي</th><th>التاريخ</th><th>الحالة</th><th>الإجراءات</th></tr>
          </thead>
          <tbody id="teacher-attendance-table"></tbody>
        </table>
      `;
      parentCard.appendChild(wrapper);
      table = document.getElementById('teacher-attendance-table');
    } else {
      return;
    }
  }

  table.innerHTML = attendance.length ? '' : '<tr><td colspan="4">لا توجد سجلات حضور مرصودة</td></tr>';

  attendance.forEach(a => {
    const student = students.find(s => s.id === a.studentId);
    table.innerHTML += `
      <tr>
        <td>${student ? student.name : 'طالب محذوف'}</td>
        <td>${a.date}</td>
        <td><strong>${a.status}</strong></td>
        <td>
          <button onclick="editAttendance('${a.id}')" class="btn-warning btn-action">تعديل</button>
          <button onclick="deleteAttendance('${a.id}')" class="btn-danger btn-action">حذف</button>
        </td>
      </tr>
    `;
  });
}

function editAttendance(attId) {
  const attendance = getData('sys_attendance');
  const item = attendance.find(a => a.id === attId);
  if (!item) return;

  const newStatus = prompt('تعديل حالة الحضور (حاضر / غائب):', item.status);
  const newDate = prompt('تعديل التاريخ (YYYY-MM-DD):', item.date);

  if (newStatus && newDate) {
    item.status = newStatus.trim();
    item.date = newDate.trim();
    setData('sys_attendance', attendance);
    renderTeacherAttendanceTable();
  }
}

function deleteAttendance(attId) {
  if (!confirm('تأكيد حذف سجل الحضور؟')) return;
  setData('sys_attendance', getData('sys_attendance').filter(a => a.id !== attId));
  renderTeacherAttendanceTable();
}

// ----------------3. قسم الواجبات التكاليف----------------
function saveHomework() {
  const subject = document.getElementById('hw-subject').value.trim();
  const desc = document.getElementById('hw-desc').value.trim();
  const dueDate = document.getElementById('hw-duedate').value;

  if (!subject || !desc || !dueDate) return alert('يرجى تعبئة كافة الحقول المطلوبة');

  const homework = getData('sys_homework');
  homework.push({ id: 'hw_' + Date.now(), subject, desc, dueDate });
  setData('sys_homework', homework);

  alert('تم نشر الواجب بنجاح!');
  document.getElementById('hw-subject').value = '';
  document.getElementById('hw-desc').value = '';
  document.getElementById('hw-duedate').value = '';

  renderTeacherHomeworkTable();
}

function renderTeacherHomeworkTable() {
  const homeworks = getData('sys_homework');
  const container = document.getElementById('teacher-my-homeworks');
  if (!container) return;

  if (!homeworks.length) {
    container.innerHTML = '<p style="color:#64748b;">لا توجد واجبات منزلية منشورة.</p>';
    return;
  }

  container.innerHTML = '';
  homeworks.forEach(hw => {
    container.innerHTML += `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="color:var(--primary); margin:0;">${hw.subject}</h4>
          <span style="font-size:12px; color:#ef4444; font-weight:bold;">تاريخ التسليم: ${hw.dueDate}</span>
        </div>
        <p style="margin:10px 0; color:#334155;">${hw.desc}</p>
        <div>
          <button onclick="editHomework('${hw.id}')" class="btn-warning btn-action">تعديل الواجب</button>
          <button onclick="deleteHomework('${hw.id}')" class="btn-danger btn-action">حذف الواجب</button>
        </div>
      </div>
    `;
  });
}

function editHomework(hwId) {
  const homeworks = getData('sys_homework');
  const item = homeworks.find(h => h.id === hwId);
  if (!item) return;

  const newSubject = prompt('تعديل المادة:', item.subject);
  const newDesc = prompt('تعديل تفاصيل الواجب:', item.desc);
  const newDueDate = prompt('تعديل موعد التسليم:', item.dueDate);

  if (newSubject && newDesc && newDueDate) {
    item.subject = newSubject.trim();
    item.desc = newDesc.trim();
    item.dueDate = newDueDate.trim();
    setData('sys_homework', homeworks);
    renderTeacherHomeworkTable();
  }
}

function deleteHomework(hwId) {
  if (!confirm('تأكيد حذف هذا الواجب؟')) return;
  setData('sys_homework', getData('sys_homework').filter(h => h.id !== hwId));
  renderTeacherHomeworkTable();
}

// ----------------4. قسم الملاحظات والتقارير----------------
function saveNote() {
  const studentId = document.getElementById('note-student').value;
  const text = document.getElementById('note-text').value.trim();

  if (!studentId || !text) return alert('يرجى اختيار الطالب وإدخال التوجيه');

  const notes = getData('sys_notes');
  notes.push({ id: 'nt_' + Date.now(), studentId, text, date: new Date().toLocaleDateString('ar-EG') });
  setData('sys_notes', notes);

  alert('تم توجيه الملاحظة بإنشاء وتحديث مباشر!');
  document.getElementById('note-text').value = '';

  renderTeacherNotesTable();
}

function renderTeacherNotesTable() {
  const notes = getData('sys_notes');
  const students = getData('sys_students');
  
  let parentCard = document.querySelector('#tch-tab-notes .teacher-card');
  let table = document.getElementById('teacher-notes-table');

  if (!table && parentCard) {
    const wrapper = document.createElement('div');
    wrapper.id = 'notes-table-wrapper';
    wrapper.style.marginTop = '20px';
    wrapper.innerHTML = `
      <h3>سجل الملاحظات والتوجيهات المرصودة</h3>
      <table>
        <thead>
          <tr><th>اسم الطالب الحقيقي</th><th>نص الملاحظة</th><th>التاريخ</th><th>الإجراءات</th></tr>
        </thead>
        <tbody id="teacher-notes-table"></tbody>
      </table>
    `;
    parentCard.appendChild(wrapper);
    table = document.getElementById('teacher-notes-table');
  }

  if (!table) return;

  table.innerHTML = notes.length ? '' : '<tr><td colspan="4">لا توجد ملاحظات تربوية مرصودة</td></tr>';

  notes.forEach(n => {
    const student = students.find(s => s.id === n.studentId);
    table.innerHTML += `
      <tr>
        <td>${student ? student.name : 'طالب محذوف'}</td>
        <td>${n.text}</td>
        <td>${n.date}</td>
        <td>
          <button onclick="editNote('${n.id}')" class="btn-warning btn-action">تعديل</button>
          <button onclick="deleteNote('${n.id}')" class="btn-danger btn-action">حذف</button>
        </td>
      </tr>
    `;
  });
}

function editNote(noteId) {
  const notes = getData('sys_notes');
  const item = notes.find(n => n.id === noteId);
  if (!item) return;

  const newText = prompt('تعديل نص الملاحظة:', item.text);
  if (newText) {
    item.text = newText.trim();
    setData('sys_notes', notes);
    renderTeacherNotesTable();
  }
}

function deleteNote(noteId) {
  if (!confirm('تأكيد حذف الملاحظة؟')) return;
  setData('sys_notes', getData('sys_notes').filter(n => n.id !== noteId));
  renderTeacherNotesTable();
}

// ==========================================
// 6. Student & Parent Dashboard Logic
// ==========================================
function switchUserTab(tabName) {
  document.getElementById('usr-tab-grades').classList.add('hidden');
  document.getElementById('usr-tab-attendance').classList.add('hidden');
  document.getElementById('usr-tab-homework').classList.add('hidden');
  document.getElementById('usr-tab-notes').classList.add('hidden');

  document.getElementById('btn-usr-grades').classList.remove('active-tab');
  document.getElementById('btn-usr-attendance').classList.remove('active-tab');
  document.getElementById('btn-usr-homework').classList.remove('active-tab');
  document.getElementById('btn-usr-notes').classList.remove('active-tab');

  if (tabName === 'grades') {
    document.getElementById('usr-tab-grades').classList.remove('hidden');
    document.getElementById('btn-usr-grades').classList.add('active-tab');
  } else if (tabName === 'attendance') {
    document.getElementById('usr-tab-attendance').classList.remove('hidden');
    document.getElementById('btn-usr-attendance').classList.add('active-tab');
  } else if (tabName === 'homework') {
    document.getElementById('usr-tab-homework').classList.remove('hidden');
    document.getElementById('btn-usr-homework').classList.add('active-tab');
  } else if (tabName === 'notes') {
    document.getElementById('usr-tab-notes').classList.remove('hidden');
    document.getElementById('btn-usr-notes').classList.add('active-tab');
  }
}

function getGradeRating(total) {
  if (total >= 90) return '<span style="color:green; font-weight:bold;">ممتاز</span>';
  if (total >= 80) return '<span style="color:blue; font-weight:bold;">جيد جداً</span>';
  if (total >= 70) return '<span style="color:darkcyan; font-weight:bold;">جيد</span>';
  if (total >= 60) return '<span style="color:orange; font-weight:bold;">مقبول</span>';
  if (total >= 50) return '<span style="color:brown; font-weight:bold;">ضعيف</span>';
  return '<span style="color:red; font-weight:bold;">راسب</span>';
}

function showStudentParentDashboard(studentId) {
  document.getElementById('user-view').classList.remove('hidden');
  
  const students = getData('sys_students');
  const student = students.find(s => s.id === studentId);
  
  if (!student) return;

  document.getElementById('student-info-header').innerHTML = `
    <h3 style="color: var(--primary);">اسم الطالب الحقيقي: <span style="color:var(--gold);">${student.name}</span></h3>
    <p style="color:#64748b; font-weight:600;">الصف الدراسي: ${student.class}</p>
  `;

  document.getElementById('report-student-detail').innerText = `اسم الطالب: ${student.name} | الصف: ${student.class}`;

  // 1. الدرجات
  const grades = getData('sys_grades').filter(g => g.studentId === studentId);
  const gradesTable = document.getElementById('student-grades-table');
  const summaryBox = document.getElementById('report-summary');

  if (!grades.length) {
    gradesTable.innerHTML = '<tr><td colspan="5">لا توجد درجات مرصودة حالياً</td></tr>';
    summaryBox.innerHTML = '';
  } else {
    gradesTable.innerHTML = '';
    let totalObtained = 0;
    let maxTotal = grades.length * 100;

    grades.forEach(g => {
      totalObtained += g.total;
      gradesTable.innerHTML += `
        <tr>
          <td>${g.subject}</td>
          <td>${g.work}</td>
          <td>${g.exam}</td>
          <td><strong>${g.total}</strong></td>
          <td>${getGradeRating(g.total)}</td>
        </tr>
      `;
    });

    const percentage = ((totalObtained / maxTotal) * 100).toFixed(1);
    summaryBox.innerHTML = `
      <p>المجموع الكلي: <strong>${totalObtained} / ${maxTotal}</strong></p>
      <p>النسبة المئوية العامة: <span style="color:var(--accent); font-size: 18px;">${percentage}%</span></p>
    `;
  }

  // 2. الحضور
  const attendance = getData('sys_attendance').filter(a => a.studentId === studentId);
  const attTable = document.getElementById('attendance-list');
  attTable.innerHTML = attendance.length ? '' : '<tr><td colspan="2">لا توجد سجلات حضور</td></tr>';
  attendance.forEach(a => {
    attTable.innerHTML += `<tr><td>${a.date}</td><td><span class="badge ${a.status === 'حاضر' ? 'badge-present' : 'badge-absent'}">${a.status}</span></td></tr>`;
  });

  // 3. الملاحظات
  const notes = getData('sys_notes').filter(n => n.studentId === studentId);
  const notesList = document.getElementById('notes-list');
  notesList.innerHTML = notes.length ? '' : '<p>لا توجد ملاحظات مرصودة حالياً.</p>';
  notes.forEach(n => {
    notesList.innerHTML += `
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-right: 4px solid var(--primary);">
        <small style="color: #64748b;">التاريخ: ${n.date}</small>
        <p style="margin-top: 5px; color: #1e293b; font-weight: 500;">${n.text}</p>
      </div>
    `;
  });

  // 4. الواجبات
  const homeworks = getData('sys_homework');
  const hwContainer = document.getElementById('student-homework-container');
  hwContainer.innerHTML = homeworks.length ? '' : '<p>لا توجد واجبات منزلية حالياً.</p>';
  homeworks.forEach(hw => {
    hwContainer.innerHTML += `
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
        <h4 style="color: var(--primary); margin-bottom: 5px;">المادة: ${hw.subject}</h4>
        <p style="color: #334155;">${hw.desc}</p>
        <small style="color: #ef4444; display: block; margin-top: 8px;">آخر موعد للتسليم: ${hw.dueDate}</small>
      </div>
    `;
  });

  switchUserTab('grades');
}

// ==========================================
// 7. System Initialization Call
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  initDatabase();
});
