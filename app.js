// ====== Helpers for LocalStorage ======
const STORAGE_KEYS = {
  NAME: "cp_username",
  SUBJECTS: "cp_subjects",
  TASKS: "cp_tasks",
  NOTES: "cp_notes"
};

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ====== Global State ======
let subjects = loadData(STORAGE_KEYS.SUBJECTS, []);
let tasks = loadData(STORAGE_KEYS.TASKS, []);
let notes = loadData(STORAGE_KEYS.NOTES, []);

// ====== DOM Elements ======
const greetingEl = document.getElementById("greeting");
const usernameInput = document.getElementById("usernameInput");
const saveNameBtn = document.getElementById("saveNameBtn");

const todayDate = document.getElementById("todayDate");
const totalSubjectsEl = document.getElementById("totalSubjects");
const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const overdueTasksEl = document.getElementById("overdueTasks");

// Subjects
const subjectForm = document.getElementById("subjectForm");
const subjectTableBody = document.getElementById("subjectTableBody");

// Tasks
const taskForm = document.getElementById("taskForm");
const taskSubjectSelect = document.getElementById("taskSubject");
const taskTableBody = document.getElementById("taskTableBody");
const showCompletedCheckbox = document.getElementById("showCompleted");

// Notes
const noteForm = document.getElementById("noteForm");
const noteList = document.getElementById("noteList");

// ====== User Name / Greeting ======
function initUser() {
  const storedName = loadData(STORAGE_KEYS.NAME, "");
  if (storedName) {
    greetingEl.textContent = "Hello, " + storedName;
    usernameInput.value = storedName;
  } else {
    greetingEl.textContent = "Hello, Student";
  }

  saveNameBtn.addEventListener("click", () => {
    const name = usernameInput.value.trim();
    saveData(STORAGE_KEYS.NAME, name);
    greetingEl.textContent = name ? "Hello, " + name : "Hello, Student";
  });
}

// ====== Navigation ======
function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.section;
      sections.forEach(sec => {
        sec.classList.toggle("visible", sec.id === target);
      });
    });
  });
}

// ====== Dashboard ======
function refreshDashboard() {
  totalSubjectsEl.textContent = subjects.length;
  totalTasksEl.textContent = tasks.length;
  completedTasksEl.textContent = tasks.filter(t => t.completed).length;

  const today = new Date().toISOString().slice(0, 10);
  overdueTasksEl.textContent = tasks.filter(
    t => !t.completed && t.dueDate && t.dueDate < today
  ).length;

  const now = new Date();
  todayDate.textContent = "Today: " + now.toDateString();
}

// ====== Subjects Logic ======
function renderSubjects() {
  subjectTableBody.innerHTML = "";
  taskSubjectSelect.innerHTML = '<option value="">Select subject</option>';

  subjects.forEach((subj, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${subj.name}</td>
      <td>${subj.code || "-"}</td>
      <td>${subj.credits || "-"}</td>
      <td>
        <button class="action-btn action-delete" data-index="${index}">Delete</button>
      </td>
    `;
    subjectTableBody.appendChild(tr);

    const option = document.createElement("option");
    option.value = subj.id;
    option.textContent = subj.name;
    taskSubjectSelect.appendChild(option);
  });

  // Bind delete
  subjectTableBody.querySelectorAll(".action-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.index, 10);
      subjects.splice(i, 1);
      saveData(STORAGE_KEYS.SUBJECTS, subjects);
      renderSubjects();
      refreshDashboard();
    });
  });
}

function initSubjectForm() {
  subjectForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("subjectName").value.trim();
    if (!name) return;

    const code = document.getElementById("subjectCode").value.trim();
    const credits = document.getElementById("subjectCredits").value;

    subjects.push({
      id: Date.now().toString(),
      name,
      code,
      credits: credits || ""
    });

    saveData(STORAGE_KEYS.SUBJECTS, subjects);
    subjectForm.reset();
    renderSubjects();
    refreshDashboard();
  });
}

// ====== Tasks Logic ======
function renderTasks() {
  taskTableBody.innerHTML = "";
  const showCompleted = showCompletedCheckbox.checked;
  const today = new Date().toISOString().slice(0, 10);

  tasks
    .filter(t => showCompleted || !t.completed)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .forEach((task, index) => {
      const subjectName =
        subjects.find(s => s.id === task.subjectId)?.name || "—";

      const priorityClass =
        task.priority === "High"
          ? "badge-high"
          : task.priority === "Low"
          ? "badge-low"
          : "badge-medium";

      const isOverdue = !task.completed && task.dueDate && task.dueDate < today;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${task.title}</td>
        <td>${subjectName}</td>
        <td>${task.dueDate || "-"}</td>
        <td><span class="badge ${priorityClass}">${task.priority}</span></td>
        <td>
          <span class="status-pill ${
            task.completed ? "status-done" : "status-pending"
          }">
            ${task.completed ? "Completed" : isOverdue ? "Overdue" : "Pending"}
          </span>
        </td>
        <td>
          <button class="action-btn action-toggle" data-index="${index}">
            ${task.completed ? "Mark Pending" : "Mark Done"}
          </button>
          <button class="action-btn action-delete" data-index="${index}">
            Delete
          </button>
        </td>
      `;
      taskTableBody.appendChild(tr);
    });

  // Bind actions
  taskTableBody.querySelectorAll(".action-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.index, 10);
      tasks[i].completed = !tasks[i].completed;
      saveData(STORAGE_KEYS.TASKS, tasks);
      renderTasks();
      refreshDashboard();
    });
  });

  taskTableBody.querySelectorAll(".action-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.index, 10);
      tasks.splice(i, 1);
      saveData(STORAGE_KEYS.TASKS, tasks);
      renderTasks();
      refreshDashboard();
    });
  });
}

function initTaskForm() {
  taskForm.addEventListener("submit", e => {
    e.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();
    const subjectId = document.getElementById("taskSubject").value;
    const dueDate = document.getElementById("taskDueDate").value;
    const priority = document.getElementById("taskPriority").value;

    if (!title || !subjectId) return;

    tasks.push({
      id: Date.now().toString(),
      title,
      subjectId,
      dueDate,
      priority,
      completed: false
    });

    saveData(STORAGE_KEYS.TASKS, tasks);
    taskForm.reset();
    renderTasks();
    refreshDashboard();
  });

  showCompletedCheckbox.addEventListener("change", renderTasks);
}

// ====== Notes Logic ======
function renderNotes() {
  noteList.innerHTML = "";
  notes.forEach((note, index) => {
    const div = document.createElement("div");
    div.className = "note";
    div.innerHTML = `
      <div class="note-title">${note.title}</div>
      <div class="note-content">${note.content}</div>
      <button class="note-delete" data-index="${index}">✕</button>
    `;
    noteList.appendChild(div);
  });

  noteList.querySelectorAll(".note-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.index, 10);
      notes.splice(i, 1);
      saveData(STORAGE_KEYS.NOTES, notes);
      renderNotes();
    });
  });
}

function initNoteForm() {
  noteForm.addEventListener("submit", e => {
    e.preventDefault();
    const title = document.getElementById("noteTitle").value.trim();
    const content = document.getElementById("noteContent").value.trim();
    if (!title || !content) return;

    notes.push({
      id: Date.now().toString(),
      title,
      content
    });

    saveData(STORAGE_KEYS.NOTES, notes);
    noteForm.reset();
    renderNotes();
  });
}

// ====== Init App ======
function init() {
  initUser();
  initNavigation();

  renderSubjects();
  initSubjectForm();

  renderTasks();
  initTaskForm();

  renderNotes();
  initNoteForm();

  refreshDashboard();
}

document.addEventListener("DOMContentLoaded", init);
