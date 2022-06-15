// element selectors
const listsContainer = document.querySelector('[data-lists]');
const newListForm = document.querySelector('[data-new-list-form]');
const newListInput = document.querySelector('[data-new-list-input]');
const deleteListButton = document.querySelector('[data-delete-list-button');
const listDisplayContainer = document.querySelector('[data-list-display-container]');
const listTitle = document.querySelector('[data-list-title]');
const listCount = document.querySelector('[data-list-count]');
const tasksContainer = document.querySelector('[data-tasks]');
const taskTemplate = document.getElementById('task-template');
const newTaskForm = document.querySelector('[data-new-task-form]');
const newTaskInput = document.querySelector('[data-new-task-input]');
const newTaskDeadline = document.querySelector('[data-new-task-deadline]');
const hideCompleteButton = document.querySelector('[data-hide-complete-button]');
const sortByNameButton = document.querySelector('[data-sort-by-name-button]');
const sortByDeadlineButton = document.querySelector('[data-sort-by-deadline-button]');
const filterDateForm = document.querySelector('[data-filter-date-form]');
const filterDateInput = document.querySelector('[data-filter-date-input]');

// local keys
const LIST_KEY = 'task.lists';
const SELECTED_LIST_ID = 'task.selectedListId';

// to reset local storage
// localStorage.setItem(LIST_KEY, null);

let lists = JSON.parse(localStorage.getItem(LIST_KEY)) || [];
let selectedListId = localStorage.getItem(SELECTED_LIST_ID);

// event listeners
newListForm.addEventListener('submit', e => {
  e.preventDefault();
  const listName = newListInput.value;
  if (listName == null || listName === '') return;
  const list = createList(listName);
  newListInput.value = null;
  lists.push(list);
  saveAndRender();
});

newTaskForm.addEventListener('submit', e => {
  e.preventDefault();
  const taskName = newTaskInput.value;
  const deadlineValue = newTaskDeadline.value.split('-');
  const deadline = {
    year: deadlineValue[0],
    month: deadlineValue[1],
    day: deadlineValue[2]
  };
  if (taskName == null || taskName === '' || deadline == null || deadline === '') return;
  const task = createTask(taskName, deadline);
  newTaskInput.value = null;
  newTaskDeadline.value = null;
  const selectedList = lists.find(list => list.id === selectedListId);
  selectedList.tasks.push(task);
  saveAndRender();
});

listsContainer.addEventListener('click', e => {
  if (e.target.tagName.toLowerCase() === 'li') {
    // get the listId of the clicked list
    selectedListId = e.target.dataset.listId;
    lists.forEach(list => list.showComplete = true);
    saveAndRender();
  }
});

tasksContainer.addEventListener('click', e => {
  if (e.target.tagName.toLowerCase() === 'input') {
    const selectedList = lists.find(list => list.id === selectedListId);
    const selectedTask = selectedList.tasks.find(task => task.id === e.target.id);
    selectedTask.complete = e.target.checked;
    save();
    renderTaskCount(selectedList);
  }
});

// button event listeners
// uses a temporary display list to display the tasks so no actual changes are made to the selected list
hideCompleteButton.addEventListener('click', e => {
  const selectedList = lists.find(list => list.id === selectedListId);
  const displayList = {...selectedList};
  if (selectedList.showComplete) {
    displayList.tasks = displayList.tasks.filter(task => !task.complete);
    selectedList.showComplete = false;
  } else {
    displayList.tasks = selectedList.tasks;
    selectedList.showComplete = true;
  }
  renderDisplayList(displayList);
})

deleteListButton.addEventListener('click', e => {
  lists = lists.filter(list => list.id !== selectedListId);
  selectedListId = null;
  saveAndRender();
});

sortByNameButton.addEventListener('click', e => {
  const selectedList = lists.find(list => list.id === selectedListId);
  const displayList = {...selectedList};
  if (!selectedList.showComplete) {
    displayList.tasks = displayList.tasks.filter(task => !task.complete);
  }
  displayList.tasks = displayList.tasks.sort((task1, task2) => task1.name.localeCompare(task2.name));
  renderDisplayList(displayList);
});

sortByDeadlineButton.addEventListener('click', e => {
  const selectedList = lists.find(list => list.id === selectedListId);
  const displayList = {...selectedList};
  if (!selectedList.showComplete) {
    displayList.tasks = displayList.tasks.filter(task => !task.complete);
  }
  displayList.tasks = displayList.tasks.sort((task1, task2) => {
      let time1 = new Date(`${task1.deadline.month}/${task1.deadline.day}/${task1.deadline.year}`);
      let time2 = new Date(`${task2.deadline.month}/${task2.deadline.day}/${task2.deadline.year}`);
      if (time1 < time2) return -1;
      else if (time1 > time2) return 1;
      else return 0;
    });
  renderDisplayList(displayList);
});

filterDateForm.addEventListener('submit', e => {
  e.preventDefault();
  const selectedList = lists.find(list => list.id === selectedListId);
  const displayList = {...selectedList};
  const dateString = filterDateInput.value.split('-');
  const date = new Date(`${dateString[1]}/${dateString[2]}/${dateString[0]}`);
  if (!selectedList.showComplete) {
    displayList.tasks = displayList.tasks.filter(task => !task.complete);
  }
  displayList.tasks = displayList.tasks.filter(task => {
    const deadlineDate = new Date(`${task.deadline.month}/${task.deadline.day}/${task.deadline.year}`);
    if (!(date < deadlineDate) && !(date > deadlineDate)) return task;
  });
  renderDisplayList(displayList);
});

// utility functions
function createList(name) {
  return { id: Date.now().toString(), name: name, tasks: [], showComplete: true };
}

function createTask(name, deadline) {
  return { id: Date.now().toString(), name: name, complete: false, deadline: deadline };
}

function updateDeadlineDate() {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth()+1;
  let yyyy = today.getFullYear();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  today = `${yyyy}-${mm}-${dd}`;
  newTaskDeadline.setAttribute("min", today);
}

// render and save
function saveAndRender() {
  save();
  render();
}

function save() {
  localStorage.setItem(LIST_KEY, JSON.stringify(lists));
  localStorage.setItem(SELECTED_LIST_ID, selectedListId);
}

function render() {
  clearElement(listsContainer);
  renderLists();
  updateDeadlineDate();
  const selectedList = lists.find(list => list.id === selectedListId);
  // if a list is selected
  if (selectedListId == null) {
    listDisplayContainer.style.display = 'none';
  } else {
    listDisplayContainer.style.display = '';
    listTitle.textContent = selectedList.name;
    renderTaskCount(selectedList);
    clearElement(tasksContainer);
    renderTasks(selectedList);
  }
}

// renders the current task list without changing the actual list
function renderDisplayList(displayList) {
  clearElement(listsContainer);
  renderLists();
  listTitle.textContent = displayList.name;
  renderTaskCount(displayList);
  clearElement(tasksContainer);
  renderTasks(displayList);
}

function taskOverdue(task) {
  let today = new Date();
  if (!task.complete && 
    (today.getMonth()+1 > Number(task.deadline.month) || 
    (today.getMonth()+1 == Number(task.deadline.month) && 
    today.getDate() >= Number(task.deadline.day))) &&
    today.getFullYear() >= Number(task.deadline.year)) {
    return true;
  } else {
    return false
  }
}

function renderTasks(selectedList) {
  selectedList.tasks.forEach(task => {
    const taskElement = document.importNode(taskTemplate.content, true);
    const checkbox = taskElement.querySelector('input');
    checkbox.id = task.id;
    checkbox.checked = task.complete;
    const label = taskElement.querySelector('label');
    label.htmlFor = task.id;
    label.append(task.name);
    const deadline = taskElement.querySelector('.deadline');
    deadline.textContent = `Due: ${task.deadline.month}/${task.deadline.day}/${task.deadline.year}`;
    // check if deadline is today/older
    if (taskOverdue(task)) {
      deadline.classList.add('deadline-warning');
      label.classList.add('deadline-warning');
    }
    tasksContainer.appendChild(taskElement);
  });
}

function renderTaskCount(selectedList) {
  const incompleteCount = selectedList.tasks.filter(task => !task.complete).length;
  const taskString = incompleteCount === 1 ? "task" : "tasks";
  listCount.textContent = `${incompleteCount} ${taskString} remaining`;
}

function renderLists() {
  lists.forEach(list => {
    const listElement = document.createElement('li');
    listElement.dataset.listId = list.id;
    listElement.classList.add('list-name');
    listElement.textContent = list.name;
    // selected list
    if (list.id === selectedListId) {
      listElement.classList.add('active-list');
    }
    listsContainer.appendChild(listElement);
  });
}

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

lists.forEach(list => list.showComplete = true);
render();