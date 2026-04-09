import axios from 'axios';

const api = axios.create({
  baseURL: 'https://nupeduli-pusdatin-nu-backend.hf.space/api/',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
