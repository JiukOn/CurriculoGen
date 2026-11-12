// Gerenciador de Múltiplos Perfis de Currículo no LocalStorage

const PROFILES_KEY = 'jiu_saved_profiles';
const ACTIVE_PROFILE_KEY = 'jiu_active_profile_id';

export const getSavedProfiles = (fallbackData = null) => {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    if (fallbackData) {
      const initial = {
        id: 'prof_default',
        name: fallbackData.cargo || 'Currículo Principal',
        updatedAt: new Date().toISOString(),
        data: fallbackData
      };
      saveProfilesList([initial]);
      setActiveProfileId(initial.id);
      return [initial];
    }
    return [];
  } catch (e) {
    console.error('Erro ao ler perfis salvos:', e);
    return [];
  }
};

export const saveProfilesList = (profiles) => {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Erro ao salvar perfis:', e);
  }
};

export const getActiveProfileId = () => {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || null;
  } catch {
    return null;
  }
};

export const setActiveProfileId = (id) => {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  } catch {}
};

export const createProfile = (name, data) => {
  const profiles = getSavedProfiles();
  const newProfile = {
    id: 'prof_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: name.trim() || 'Sem Título',
    updatedAt: new Date().toISOString(),
    data: data
  };
  profiles.unshift(newProfile);
  saveProfilesList(profiles);
  setActiveProfileId(newProfile.id);
  return newProfile;
};

export const updateProfile = (id, data, newName = null) => {
  const profiles = getSavedProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx !== -1) {
    profiles[idx].data = data;
    profiles[idx].updatedAt = new Date().toISOString();
    if (newName) profiles[idx].name = newName.trim();
    saveProfilesList(profiles);
    return profiles[idx];
  }
  return null;
};

export const renameProfile = (id, newName) => {
  const cleanName = String(newName || '').trim();
  if (!cleanName) return null;
  const profiles = getSavedProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx !== -1) {
    profiles[idx].name = cleanName;
    profiles[idx].updatedAt = new Date().toISOString();
    saveProfilesList(profiles);
    return profiles[idx];
  }
  return null;
};

export const duplicateProfile = (id) => {
  const profiles = getSavedProfiles();
  const source = profiles.find(p => p.id === id);
  if (!source) return null;
  const clonedData = JSON.parse(JSON.stringify(source.data || {}));
  return createProfile(`${source.name} (Cópia)`, clonedData);
};

export const deleteProfile = (id) => {
  let profiles = getSavedProfiles();
  profiles = profiles.filter(p => p.id !== id);
  saveProfilesList(profiles);
  if (getActiveProfileId() === id) {
    setActiveProfileId(profiles.length > 0 ? profiles[0].id : null);
  }
  return profiles;
};
