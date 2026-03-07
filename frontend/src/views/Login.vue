<template>
  <div class="auth-shell">
    <div class="auth-panel">

      <div class="auth-brand">
        <span class="auth-brand-mark">●</span>
        <span class="auth-brand-name">Einleuchtplan</span>
      </div>

      <div class="auth-divider"></div>

      <p class="auth-mode-label">{{ isRegister ? 'Neuen Account erstellen' : 'Anmelden' }}</p>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="error" class="auth-error">
          {{ error }}
        </div>

        <div v-if="isRegister" class="field">
          <label class="field-label">Name</label>
          <input
            v-model="form.name"
            type="text"
            class="field-input"
            placeholder="Max Mustermann"
            required
          />
        </div>

        <div class="field">
          <label class="field-label">E-Mail</label>
          <input
            v-model="form.email"
            type="email"
            class="field-input"
            placeholder="email@beispiel.de"
            required
          />
        </div>

        <div class="field">
          <label class="field-label">Passwort</label>
          <input
            v-model="form.password"
            type="password"
            class="field-input"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" class="auth-submit" :disabled="loading">
          {{ loading ? 'Lädt …' : (isRegister ? 'Registrieren' : 'Anmelden') }}
        </button>
      </form>

      <p class="auth-toggle">
        {{ isRegister ? 'Bereits registriert?' : 'Noch kein Account?' }}
        <a @click.prevent="isRegister = !isRegister" href="#">
          {{ isRegister ? 'Anmelden' : 'Registrieren' }}
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

const form = ref({ email: '', password: '', name: '' })

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
.auth-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: var(--space-4);
}

.auth-panel {
  width: 100%;
  max-width: 360px;
  background: var(--color-surface-base);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-lg);
}

/* Brand */
.auth-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.auth-brand-mark {
  color: var(--color-primary);
  font-size: 10px;
  line-height: 1;
}

.auth-brand-name {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  letter-spacing: 0.04em;
  color: var(--color-text-primary);
  text-transform: uppercase;
}

.auth-divider {
  height: 1px;
  background: var(--color-border-light);
  margin-bottom: var(--space-6);
}

.auth-mode-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-5);
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-error {
  background: rgba(184, 64, 64, 0.08);
  border: 1px solid rgba(184, 64, 64, 0.2);
  color: var(--color-error);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.field-input {
  width: 100%;
  padding: var(--space-3) var(--space-3);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.14s, box-shadow 0.14s;
}

.field-input::placeholder {
  color: var(--color-text-tertiary);
}

.field-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.auth-submit {
  width: 100%;
  padding: var(--space-3);
  margin-top: var(--space-2);
  background: var(--color-primary);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.14s, opacity 0.14s;
}

.auth-submit:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.auth-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Footer */
.auth-toggle {
  margin-top: var(--space-5);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.auth-toggle a {
  color: var(--color-primary);
  font-weight: var(--font-medium);
  cursor: pointer;
}

.auth-toggle a:hover {
  color: var(--color-primary-hover);
}
</style>
