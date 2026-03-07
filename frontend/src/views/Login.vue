<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Theater-Einleuchtplan</h1>
      <p class="subtitle">{{ isRegister ? 'Neuen Account erstellen' : 'Anmelden' }}</p>

      <form @submit.prevent="handleSubmit">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="isRegister" class="form-group">
          <label>Name</label>
          <input 
            v-model="form.name" 
            type="text" 
            placeholder="Max Mustermann"
            required
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input 
            v-model="form.email" 
            type="email" 
            placeholder="email@example.com"
            required
          />
        </div>

        <div class="form-group">
          <label>Passwort</label>
          <input 
            v-model="form.password" 
            type="password" 
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Lädt...' : (isRegister ? 'Registrieren' : 'Anmelden') }}
        </button>
      </form>

      <p class="toggle-mode">
        {{ isRegister ? 'Bereits registriert?' : 'Noch kein Account?' }}
        <a @click="isRegister = !isRegister" href="#">
          {{ isRegister ? 'Jetzt anmelden' : 'Jetzt registrieren' }}
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isRegister = ref(false)
const loading = ref(false)
const error = ref(null)

const form = ref({
  email: '',
  password: '',
  name: ''
})

const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    if (isRegister.value) {
      await authStore.register(form.value.email, form.value.password, form.value.name)
    } else {
      await authStore.login(form.value.email, form.value.password)
    }
    router.push('/')
  } catch (err) {
    error.value = err.message || 'Ein Fehler ist aufgetreten'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 60% 50% at 50% -10%, rgba(196, 131, 42, 0.12) 0%, transparent 70%),
    var(--color-bg);
  padding: var(--space-4);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  opacity: 0.5;
}

.login-card {
  background: var(--color-surface-base);
  border: 1px solid var(--color-border-default);
  border-top-color: rgba(196, 131, 42, 0.3);
  padding: var(--space-8);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 380px;
}

h1 {
  text-align: center;
  margin-bottom: var(--space-2);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: var(--space-6);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: var(--font-medium);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.form-group input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
  transition: border-color 0.14s, box-shadow 0.14s;
}

.form-group input::placeholder {
  color: var(--color-text-tertiary);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(196, 131, 42, 0.1);
}

.btn-primary {
  width: 100%;
  padding: var(--space-3);
  background: var(--color-primary);
  color: #0a0a0c;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  letter-spacing: 0.02em;
  margin-top: var(--space-4);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error-message {
  background: rgba(184, 64, 64, 0.1);
  border: 1px solid rgba(184, 64, 64, 0.25);
  color: #d07070;
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
}

.toggle-mode {
  text-align: center;
  margin-top: var(--space-5);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.toggle-mode a {
  color: var(--color-primary);
  cursor: pointer;
  font-weight: var(--font-medium);
}
</style>
