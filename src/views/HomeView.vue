<template>
  <div class="bg-gradient-to-r from-teal-400 to-cyan-500 flex flex-col items-center justify-start min-h-screen pt-16">
    <NavBar />
    <div class="flex flex-col items-center">
      <h2 class="text-5xl font-extrabold text-white mt-6 mb-4">Gérez Vos Tâches Efficacement</h2>
      <div v-if="successMessage" class="bg-green-300 text-green-900 p-4 rounded-lg shadow-lg mb-4 transition-transform transform hover:scale-105">
        {{ successMessage }}
      </div>
      <div class="flex items-center justify-between mb-8 w-full max-w-5xl">
        <div class="flex items-center">
          <div class="bg-white p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105">
            <div class="grid grid-cols-4 gap-2">
              <div class="w-16 h-16 bg-teal-100 flex items-center justify-center rounded-lg shadow-md">
                <i class="fas fa-check text-teal-500"></i>
              </div>
              <!-- Répéter pour d'autres icônes -->
            </div>
          </div>
        </div>
        <div v-if="showModal" class="bg-white p-6 rounded-lg shadow-lg w-80 transition-transform transform hover:scale-105">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-800">{{ editingTask ? 'Modifier la Tâche' : 'Ajouter une Nouvelle Tâche' }}</h2>
            <button @click="closeModal" class="text-red-500 hover:text-red-700 transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <p class="text-red-600 mb-2">{{ selectedDay }}</p>
          <input v-model="newTask" class="w-full border-b border-gray-300 mb-4 p-2 focus:outline-none focus:border-teal-500 transition-colors" placeholder="Nouvelle tâche" type="text"/>
          <button @click="editingTask ? updateTask() : addTask()" class="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors">
            {{ editingTask ? 'Mettre à Jour' : 'Soumettre' }}
          </button>
        </div>
      </div>
      <div class="bg-white shadow-lg rounded-lg p-6 w-full">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-4xl font-bold text-gray-800">Vos Tâches</h1>
          <button @click="showModal = true" class="bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-600 transition-colors">
            <i class="fas fa-plus mr-2"></i>
            Nouvelle Tâche
          </button>
        </div>
        <input
          v-model="filter"
          class="w-full border-b border-gray-300 mb-4 p-2 focus:outline-none focus:border-teal-500 transition-colors"
          placeholder="Filtrer les tâches..."
          type="text"
        />
        <div class="grid grid-cols-7 gap-6 text-center">
          <div class="flex-grow border p-8 cursor-pointer hover:bg-teal-50 transition-colors" v-for="(day, index) in days" :key="index" @click="selectDay(day)">
            <div class="font-semibold text-xl text-gray-700">{{ day }}</div>
            <div v-for="task in filteredTasks(day)" :key="task._id" class="mt-4 bg-teal-100 p-6 rounded overflow-visible shadow-md transition-transform transform hover:scale-105">
              <div class="font-semibold text-lg text-gray-700 truncate w-32 hover:text-clip">
                {{ task.title.length > 20 ? task.title.slice(0, 20) + '...' : task.title }}
                <button v-if="task.title.length > 20" @click.stop="showTaskDetails(task)" class="text-teal-500 ml-2 hover:text-teal-700 transition-colors">Voir plus</button>
              </div>
              <button @click="editTask(task)" class="text-teal-500 ml-2 hover:text-teal-700 transition-colors">Modifier</button>
              <button @click="confirmDelete(task)" class="text-red-500 ml-2 hover:text-red-700 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation -->
    <div v-if="showConfirmModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 class="text-lg font-semibold text-gray-800">Confirmer la suppression</h2>
        <p class="text-gray-600 mb-4">Êtes-vous sûr de vouloir supprimer cette tâche ?</p>
        <div class="flex justify-between">
          <button @click="deleteTask(taskToDelete)" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">Supprimer</button>
          <button @click="showConfirmModal = false" class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition-colors">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Modal de détails de la tâche -->
    <div v-if="showDetailModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 class="text-lg font-semibold text-gray-800">{{ selectedTask.title }}</h2>
        <p class="text-gray-600 mb-4">{{ selectedTask.day }}</p>
        <p class="text-gray-800">{{ selectedTask.description }}</p>
        <button @click="showDetailModal = false" class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition-colors">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import NavBar from '../components/NavBar.vue';

const showModal = ref(false);
const showConfirmModal = ref(false);
const showDetailModal = ref(false);
const taskToDelete = ref(null);
const selectedTask = ref({});
const days = ref(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
const selectedDay = ref('');
const newTask = ref('');
const tasks = ref([]);
const editingTask = ref(null);
const successMessage = ref('');
const filter = ref('');

onMounted(async () => {
  await fetchTasks();
});

const fetchTasks = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:3000/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    tasks.value = response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
};

const filteredTasks = (day) => {
  return tasks.value
    .filter(task => task.day === day)
    .filter(task => task.title.toLowerCase().includes(filter.value.toLowerCase()));
};

const addTask = async () => {
  if (newTask.value && selectedDay.value) {
    try {
      const task = { day: selectedDay.value, title: newTask.value };
      const response = await axios.post('http://localhost:3000/tasks', task);
      tasks.value.push(response.data);
      successMessage.value = 'Tâche ajoutée avec succès!';
      closeModal();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  } else {
    alert('Veuillez entrer une tâche et sélectionner un jour.');
  }
};

const updateTask = async () => {
  if (editingTask.value) {
    try {
      const response = await axios.put(`http://localhost:3000/tasks/${editingTask.value._id}`, {
        title: newTask.value,
        day: selectedDay.value
      });
      const index = tasks.value.findIndex(t => t._id === editingTask.value._id);
      tasks.value[index] = response.data;
      successMessage.value = 'Tâche modifiée avec succès!';
      closeModal();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }
};

const confirmDelete = (task) => {
  taskToDelete.value = task; // Stocker la tâche à supprimer
  showConfirmModal.value = true; // Afficher le modal de confirmation
};

const deleteTask = async (task) => {
  try {
    await axios.delete(`http://localhost:3000/tasks/${task._id}`);
    tasks.value = tasks.value.filter(t => t._id !== task._id);
    successMessage.value = 'Tâche supprimée avec succès!';
    showConfirmModal.value = false; // Fermer le modal de confirmation
    taskToDelete.value = null; // Réinitialiser la tâche à supprimer
  } catch (error) {
    console.error('Error deleting task:', error);
  }
};

const selectDay = (day) => {
  selectedDay.value = day;
  showModal.value = true;
};

const editTask = (task) => {
  showModal.value = true;
  editingTask.value = task;
  newTask.value = task.title;
  selectedDay.value = task.day;
};

const showTaskDetails = (task) => {
  selectedTask.value = task;
  showDetailModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingTask.value = null;
  newTask.value = '';
  selectedDay.value = '';
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
};
</script>

<style scoped>
.grid {
  grid-template-columns: repeat(7, 1fr);
  gap: 1rem;
}

.grid > div {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  background-color: #f7f7f7;
  cursor: pointer;
}

.grid > div:hover {
  background-color: #f2f2f2;
}

.calendar {
  display: flex;
  flex-wrap: wrap; /* Wrap the columns when needed */
  gap: 10px; 
}

.day-container {
  flex: 1 0 14.2857%; /* Equal width for each column */
  height: 200px; /* Adjust the height as needed */
  border: 1px solid #ccc;
  padding: 10px;
  box-sizing: border-box;
}
</style>
